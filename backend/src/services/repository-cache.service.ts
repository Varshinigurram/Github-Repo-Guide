import {
  RepositoryMetadata,
  RepositoryStructure,
  RepositoryFileContents,
  TechnologyAnalysisResult,
  RepositoryEvidencePackage,
  RepositoryAIAnalysis,
  RepositoryHealthResult,
  RepositoryArchitectureResult,
  RepositoryApiResult
} from '../types/repository.types.js';

/**
 * Deterministic repository analysis payload cached across /api/analyze and /api/ask.
 */
export interface DeterministicRepositoryAnalysis {
  repository: RepositoryMetadata;
  structure: RepositoryStructure;
  fileContents: RepositoryFileContents;
  technologies: TechnologyAnalysisResult;
  evidence: RepositoryEvidencePackage;
  analysis?: RepositoryAIAnalysis;
  health: RepositoryHealthResult;
  architecture: RepositoryArchitectureResult;
  api: RepositoryApiResult;
}

interface CacheEntry {
  key: string;
  data: DeterministicRepositoryAnalysis;
  timestamp: number;
  lastAccessed: number;
  accessOrder: number;
}

export class RepositoryCacheService {
  private readonly maxEntries: number = 10;
  private readonly ttlMs: number = 5 * 60 * 1000; // 5 minutes TTL
  private cache: Map<string, CacheEntry> = new Map();
  private inFlightMap: Map<string, Promise<DeterministicRepositoryAnalysis>> = new Map();
  private accessCounter: number = 0;

  constructor(maxEntries: number = 10, ttlMs: number = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Normalizes repository owner and name into a canonical key: "owner/repository".
   */
  public canonicalizeKey(owner: string, repo: string): string {
    return `${owner.trim().toLowerCase()}/${repo.trim().toLowerCase()}`;
  }

  /**
   * Checks if a valid, non-expired cache entry exists for the canonical key.
   */
  public get(key: string): DeterministicRepositoryAnalysis | null {
    const entry = this.cache.get(key);
    if (!entry) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[cache] MISS ${key}`);
      }
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[cache] EXPIRED ${key}`);
        console.log(`[cache] MISS ${key}`);
      }
      return null;
    }

    entry.lastAccessed = now;
    entry.accessOrder = ++this.accessCounter;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[cache] HIT ${key}`);
    }
    return entry.data;
  }

  /**
   * Stores deterministic repository analysis data into the in-memory cache.
   * Performs LRU eviction if maximum capacity is reached.
   */
  public set(key: string, data: DeterministicRepositoryAnalysis): void {
    const now = Date.now();

    // Remove any expired entries first
    for (const [k, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(k);
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[cache] EXPIRED ${k}`);
        }
      }
    }

    // Perform LRU eviction if cache size exceeds maxEntries
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      let oldestKey: string | null = null;
      let oldestAccessOrder = Infinity;

      for (const [k, entry] of this.cache.entries()) {
        if (entry.accessOrder < oldestAccessOrder) {
          oldestAccessOrder = entry.accessOrder;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[cache] EVICT ${oldestKey}`);
        }
      }
    }

    this.cache.set(key, {
      key,
      data,
      timestamp: now,
      lastAccessed: now,
      accessOrder: ++this.accessCounter
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[cache] STORE ${key}`);
    }
  }

  /**
   * Deduplicates concurrent in-flight repository analysis requests for the same canonical key.
   */
  public async executeOrReuseInFlight(
    key: string,
    fetchFn: () => Promise<DeterministicRepositoryAnalysis>
  ): Promise<DeterministicRepositoryAnalysis> {
    // 1. Check existing cached entry
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    // 2. Check if an in-flight request is already running for this key
    const inFlightPromise = this.inFlightMap.get(key);
    if (inFlightPromise) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[cache] IN-FLIGHT REUSE ${key}`);
      }
      return inFlightPromise;
    }

    // 3. Initiate new analysis promise
    const promise = (async () => {
      try {
        const result = await fetchFn();
        this.set(key, result);
        return result;
      } finally {
        this.inFlightMap.delete(key);
      }
    })();

    this.inFlightMap.set(key, promise);
    return promise;
  }

  /**
   * Returns current cache size (entry count).
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Returns number of active in-flight requests.
   */
  public inFlightCount(): number {
    return this.inFlightMap.size;
  }

  /**
   * Clears all cache entries and in-flight promises (useful for testing).
   */
  public clear(): void {
    this.cache.clear();
    this.inFlightMap.clear();
  }
}

export const repositoryCacheService = new RepositoryCacheService();
