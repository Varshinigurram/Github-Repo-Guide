import { ParsedRepository } from '../types/repository.types';

/**
 * Validates and extracts owner & repository from a public GitHub repository URL.
 * 
 * Accepted formats:
 * - https://github.com/owner/repository
 * - https://github.com/owner/repository/ (trailing slash)
 * - https://github.com/owner/repository.git (optional .git suffix)
 * 
 * Rejects non-GitHub URLs, missing paths, and sub-resource paths (/issues, /pulls, /tree, /blob, etc.).
 */
export function parseGitHubUrl(rawUrl: string): ParsedRepository | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  // Must be github.com domain
  const hostname = parsedUrl.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    return null;
  }

  // Must be http or https
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return null;
  }

  // Normalize pathname: remove trailing slashes
  let pathname = parsedUrl.pathname;
  while (pathname.endsWith('/') && pathname.length > 1) {
    pathname = pathname.slice(0, -1);
  }

  // Split into path segments (filtering out empty segments caused by slashes)
  const segments = pathname.split('/').filter(Boolean);

  // A repository URL MUST consist of exactly 2 segments: [owner, repository]
  if (segments.length !== 2) {
    return null;
  }

  let [owner, repo] = segments;

  // Strip trailing .git if present
  if (repo.toLowerCase().endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  // Basic validation for owner and repo names
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;

  if (!ownerRegex.test(owner) || !repoRegex.test(repo)) {
    return null;
  }

  // Filter reserved top-level GitHub paths that are not valid usernames
  const reservedPaths = new Set([
    'features', 'enterprise', 'pricing', 'readme', 'topics', 'collections',
    'trending', 'events', 'sponsor', 'explore', 'notifications', 'settings',
    'orgs', 'organizations', 'users', 'login', 'signup', 'about', 'contact',
    'security', 'customer-stories', 'team'
  ]);

  if (reservedPaths.has(owner.toLowerCase())) {
    return null;
  }

  const normalizedUrl = `https://github.com/${owner}/${repo}`;

  return {
    owner,
    repository: repo,
    url: normalizedUrl
  };
}
