import {
  RepositoryEvidencePackage,
  RepositoryHealthResult,
  HealthCategoryScore,
  HealthCategoryStatus,
  HealthGrade
} from '../types/repository.types.js';

export class HealthService {
  /**
   * Calculates a transparent, deterministic repository health score (0-100)
   * from the provided RepositoryEvidencePackage with zero AI or network calls.
   */
  public calculateRepositoryHealth(evidence: RepositoryEvidencePackage): RepositoryHealthResult {
    const categories: HealthCategoryScore[] = [
      this.evaluateDocumentation(evidence),
      this.evaluateProjectStructure(evidence),
      this.evaluateTesting(evidence),
      this.evaluateDependenciesAndBuild(evidence),
      this.evaluateCICD(evidence),
      this.evaluateContainerization(evidence),
      this.evaluateConfigurationHygiene(evidence),
      this.evaluateMaintenance(evidence)
    ];

    const totalScore = Math.min(
      100,
      Math.max(0, categories.reduce((sum, cat) => sum + cat.score, 0))
    );

    const grade = this.calculateGrade(totalScore);
    const summary = `Repository health for ${evidence.repository.name} evaluated to ${totalScore}/100 (Grade ${grade}).`;

    const strengths: string[] = [];
    const improvements: string[] = [];

    for (const cat of categories) {
      if (cat.status === 'strong' || cat.status === 'good') {
        strengths.push(`${cat.name}: Evaluated as ${cat.status} (${cat.score}/${cat.maxScore} pts).`);
      } else {
        improvements.push(`${cat.name}: Recommended improvement area (${cat.score}/${cat.maxScore} pts).`);
      }
    }

    const limitations: string[] = [];
    const isLimited =
      evidence.completeness.responseLimited ||
      evidence.completeness.contentLimited ||
      evidence.completeness.treeTruncated ||
      evidence.completeness.skippedFilesCount > 0 ||
      evidence.completeness.truncatedFilesCount > 0;

    if (isLimited) {
      limitations.push(
        'Health score is based on available repository evidence; analysis was limited by incomplete repository evidence.'
      );
    }

    return {
      score: totalScore,
      grade,
      summary,
      categories,
      strengths,
      improvements,
      limitations
    };
  }

  /**
   * Helper to calculate standard status based on score percentage thresholds.
   * >= 80% = strong, >= 60% = good, >= 40% = fair, < 40% = weak
   */
  public calculateStatus(score: number, maxScore: number): HealthCategoryStatus {
    const ratio = score / maxScore;
    if (ratio >= 0.8) return 'strong';
    if (ratio >= 0.6) return 'good';
    if (ratio >= 0.4) return 'fair';
    return 'weak';
  }

  /**
   * Helper to calculate letter grade based on total 0-100 score.
   * 90-100 = A, 80-89 = B, 70-79 = C, 60-69 = D, 0-59 = F
   */
  public calculateGrade(totalScore: number): HealthGrade {
    if (totalScore >= 90) return 'A';
    if (totalScore >= 80) return 'B';
    if (totalScore >= 70) return 'C';
    if (totalScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Helper to check whether evidence package is incomplete.
   */
  private isEvidenceIncomplete(evidence: RepositoryEvidencePackage): boolean {
    return (
      evidence.completeness.responseLimited ||
      evidence.completeness.contentLimited ||
      evidence.completeness.treeTruncated ||
      evidence.completeness.skippedFilesCount > 0 ||
      evidence.completeness.truncatedFilesCount > 0
    );
  }

  /**
   * 1. Documentation (Max 15 Points)
   */
  private evaluateDocumentation(evidence: RepositoryEvidencePackage): HealthCategoryScore {
    const maxScore = 15;
    let score = 0;
    const evidenceList: string[] = [];

    const readmeDoc = evidence.documentationFiles.find(
      (d) => d.type === 'readme' || d.path.toLowerCase().startsWith('readme')
    );

    if (readmeDoc) {
      score += 6;
      evidenceList.push(`${readmeDoc.path} detected`);

      const readmeFileContent = evidence.fileContents.find(
        (f) => f.path.toLowerCase() === readmeDoc.path.toLowerCase()
      );

      if (readmeFileContent && readmeFileContent.content && readmeFileContent.content.length > 500) {
        score += 2;
        evidenceList.push(`Substantial README content detected (${readmeFileContent.content.length} characters)`);
      }
    }

    const contributingDoc = evidence.documentationFiles.find(
      (d) => d.type === 'contributing_guide' || d.path.toLowerCase().includes('contributing')
    );
    if (contributingDoc) {
      score += 3;
      evidenceList.push(`${contributingDoc.path} detected`);
    }

    const licenseDoc = evidence.documentationFiles.find(
      (d) => d.path.toLowerCase().includes('license')
    );
    if (licenseDoc || evidence.repository.license) {
      score += 2;
      evidenceList.push(`License evidence detected (${evidence.repository.license || licenseDoc?.path})`);
    }

    const otherDocs = evidence.documentationFiles.filter(
      (d) => d.type === 'doc_directory' || d.path.toLowerCase().startsWith('docs/')
    );
    if (otherDocs.length > 0) {
      score += 2;
      evidenceList.push(`Documentation directory files detected (${otherDocs.length} items)`);
    }

    if (evidence.repository.description && score < maxScore) {
      score += 1;
      evidenceList.push('Repository description present');
    }

    score = Math.min(maxScore, score);
    if (evidenceList.length === 0) {
      if (this.isEvidenceIncomplete(evidence)) {
        evidenceList.push('Documentation evidence was not observed in the available repository evidence.');
      } else {
        evidenceList.push('Documentation files (README, License, Contributing guide) were absent from the repository.');
      }
    }

    return {
      name: 'Documentation',
      score,
      maxScore,
      status: this.calculateStatus(score, maxScore),
      evidence: evidenceList
    };
  }

  /**
   * 2. Project Structure (Max 15 Points)
   */
  private evaluateProjectStructure(evidence: RepositoryEvidencePackage): HealthCategoryScore {
    const maxScore = 15;
    let score = 0;
    const evidenceList: string[] = [];

    if (evidence.entryPoints.length > 0) {
      score += 4;
      evidenceList.push(`Entry point candidates detected (${evidence.entryPoints.map((e) => e.path).join(', ')})`);
    }

    const hasSourceDir =
      evidence.structure.returnedDirectories > 0 ||
      evidence.structure.importantFiles.some((f) =>
        f.startsWith('src/') || f.startsWith('lib/') || f.startsWith('app/') || f.startsWith('cmd/') || f.startsWith('pkg/') || f.startsWith('crates/')
      );

    if (hasSourceDir) {
      score += 4;
      evidenceList.push('Source code directory organization detected');
    }

    if (evidence.configFiles.length > 0) {
      score += 4;
      evidenceList.push(`Configuration files present (${evidence.configFiles.length} items)`);
    }

    if (evidence.manifestFiles.length > 0) {
      score += 3;
      evidenceList.push(`Dependency manifest files present (${evidence.manifestFiles.length} items)`);
    }

    score = Math.min(maxScore, score);
    if (evidenceList.length === 0) {
      if (this.isEvidenceIncomplete(evidence)) {
        evidenceList.push('Project structure evidence was not observed in the available repository evidence.');
      } else {
        evidenceList.push('Standard project structure indicators were absent from the repository.');
      }
    }

    return {
      name: 'Project Structure',
      score,
      maxScore,
      status: this.calculateStatus(score, maxScore),
      evidence: evidenceList
    };
  }

  /**
   * 3. Testing (Max 15 Points)
   */
  private evaluateTesting(evidence: RepositoryEvidencePackage): HealthCategoryScore {
    const maxScore = 15;
    let score = 0;
    const evidenceList: string[] = [];

    const testingTools = evidence.technologies.testingTools || [];
    if (testingTools.length > 0) {
      score += 6;
      evidenceList.push(`Testing framework detected (${testingTools.map((t) => t.name).join(', ')})`);
    }

    const packageJsonContent = evidence.fileContents.find(
      (f) => f.path.toLowerCase() === 'package.json' && f.content
    );
    if (packageJsonContent && packageJsonContent.content) {
      if (packageJsonContent.content.includes('"test"')) {
        score += 4;
        evidenceList.push('Test execution script detected in package.json');
      }
    }

    const hasTestFilesOrDirs = evidence.structure.importantFiles.some((f) => {
      const lower = f.toLowerCase();
      return (
        lower.startsWith('test/') ||
        lower.startsWith('tests/') ||
        lower.startsWith('spec/') ||
        lower.startsWith('__tests__/') ||
        lower.includes('.test.') ||
        lower.includes('.spec.') ||
        lower.endsWith('_test.go')
      );
    });

    if (hasTestFilesOrDirs) {
      score += 5;
      evidenceList.push('Test files or test directory present in repository structure');
    }

    score = Math.min(maxScore, score);
    if (score === 0 || evidenceList.length === 0) {
      evidenceList.length = 0;
      if (this.isEvidenceIncomplete(evidence)) {
        evidenceList.push('Testing evidence was not observed in the available repository evidence.');
      } else {
        evidenceList.push('Testing configuration and test files were absent from the repository.');
      }
    }

    return {
      name: 'Testing',
      score,
      maxScore,
      status: this.calculateStatus(score, maxScore),
      evidence: evidenceList
    };
  }

  /**
   * 4. Dependencies & Build (Max 15 Points)
   */
  private evaluateDependenciesAndBuild(evidence: RepositoryEvidencePackage): HealthCategoryScore {
    const maxScore = 15;
    let score = 0;
    const evidenceList: string[] = [];

    const manifests = evidence.manifestFiles.filter((m) => !m.type.endsWith('_lockfile'));
    if (manifests.length > 0) {
      score += 5;
      evidenceList.push(`Dependency manifests detected (${manifests.map((m) => m.path).join(', ')})`);
    }

    const lockfiles = evidence.manifestFiles.filter((m) => m.type.endsWith('_lockfile'));
    if (lockfiles.length > 0) {
      score += 4;
      evidenceList.push(`Lockfiles detected (${lockfiles.map((l) => l.path).join(', ')})`);
    }

    const buildTools = evidence.technologies.buildTools || [];
    const buildConfigs = evidence.configFiles.filter(
      (c) => c.type === 'transpiler_config' || c.type === 'typescript_config' || c.type === 'build_config'
    );

    if (buildTools.length > 0 || buildConfigs.length > 0) {
      score += 3;
      evidenceList.push(`Build tooling & configuration detected (${buildConfigs.map((c) => c.path).join(', ') || 'build tools'})`);
    }

    const packageManagers = evidence.technologies.packageManagers || [];
    if (packageManagers.length > 0) {
      score += 3;
      evidenceList.push(`Package manager detected (${packageManagers.map((p) => p.name).join(', ')})`);
    }

    score = Math.min(maxScore, score);
    if (evidenceList.length === 0) {
      if (this.isEvidenceIncomplete(evidence)) {
        evidenceList.push('Dependencies and build evidence was not observed in the available repository evidence.');
      } else {
        evidenceList.push('Dependency manifests and build configurations were absent from the repository.');
      }
    }

    return {
      name: 'Dependencies/Build',
      score,
      maxScore,
      status: this.calculateStatus(score, maxScore),
      evidence: evidenceList
    };
  }

  /**
   * 5. CI/CD (Max 10 Points)
   */
  private evaluateCICD(evidence: RepositoryEvidencePackage): HealthCategoryScore {
    const maxScore = 10;
    let score = 0;
    const evidenceList: string[] = [];

    const ciFiles = evidence.structure.importantFiles.filter((f) => {
      const lower = f.toLowerCase();
      return (
        lower.startsWith('.github/workflows/') ||
        lower.includes('.travis.yml') ||
        lower.includes('circleci') ||
        lower.includes('.gitlab-ci.yml')
      );
    });

    if (ciFiles.length > 0) {
      score += 10;
      evidenceList.push(`CI/CD pipeline workflow configuration detected (${ciFiles.join(', ')})`);
    }

    score = Math.min(maxScore, score);
    if (score === 0 || evidenceList.length === 0) {
      evidenceList.length = 0;
      if (this.isEvidenceIncomplete(evidence)) {
        evidenceList.push('CI/CD pipeline evidence was not observed in the available repository evidence.');
      } else {
        evidenceList.push('CI/CD workflow configurations (.github/workflows, etc.) were absent from the repository.');
      }
    }

    return {
      name: 'CI/CD',
      score,
      maxScore,
      status: this.calculateStatus(score, maxScore),
      evidence: evidenceList
    };
  }

  /**
   * 6. Containerization (Max 10 Points)
   */
  private evaluateContainerization(evidence: RepositoryEvidencePackage): HealthCategoryScore {
    const maxScore = 10;
    let score = 0;
    const evidenceList: string[] = [];

    const containerFiles = evidence.configFiles.filter((c) => c.type === 'container_config')
      .concat(
        evidence.structure.importantFiles
          .filter((f) => {
            const lower = f.toLowerCase();
            return lower.includes('dockerfile') || lower.includes('docker-compose') || lower.endsWith('compose.yaml');
          })
          .map((f) => ({ path: f, type: 'container_config' }))
      );

    const uniqueContainerPaths = Array.from(new Set(containerFiles.map((c) => c.path)));

    if (uniqueContainerPaths.length > 0) {
      score += 10;
      evidenceList.push(`Containerization configuration detected (${uniqueContainerPaths.join(', ')})`);
    }

    score = Math.min(maxScore, score);
    if (score === 0 || evidenceList.length === 0) {
      evidenceList.length = 0;
      if (this.isEvidenceIncomplete(evidence)) {
        evidenceList.push('Containerization evidence was not observed in the available repository evidence.');
      } else {
        evidenceList.push('Containerization files (Dockerfile, docker-compose) were absent from the repository.');
      }
    }

    return {
      name: 'Containerization',
      score,
      maxScore,
      status: this.calculateStatus(score, maxScore),
      evidence: evidenceList
    };
  }

  /**
   * 7. Configuration Hygiene (Max 10 Points)
   */
  private evaluateConfigurationHygiene(evidence: RepositoryEvidencePackage): HealthCategoryScore {
    const maxScore = 10;
    let score = 0;
    const evidenceList: string[] = [];

    // 1. .gitignore detection
    const hasGitIgnore =
      evidence.structure.importantFiles.some((f) => f.toLowerCase().endsWith('.gitignore')) ||
      evidence.configFiles.some((c) => c.path.toLowerCase().endsWith('.gitignore')) ||
      evidence.fileContents.some((f) => f.path.toLowerCase().endsWith('.gitignore'));

    if (hasGitIgnore) {
      score += 4;
      evidenceList.push('.gitignore detected');
    }

    // 2. Environment configuration template (.env.example / .env.sample / .env.template)
    const hasEnvExample =
      evidence.configFiles.some(
        (c) =>
          c.type === 'environment_template' ||
          c.path.toLowerCase().includes('.env.example') ||
          c.path.toLowerCase().includes('.env.sample') ||
          c.path.toLowerCase().includes('.env.template')
      ) ||
      evidence.structure.importantFiles.some(
        (f) =>
          f.toLowerCase().includes('.env.example') ||
          f.toLowerCase().includes('.env.sample') ||
          f.toLowerCase().includes('.env.template')
      ) ||
      evidence.fileContents.some(
        (f) =>
          f.path.toLowerCase().includes('.env.example') ||
          f.path.toLowerCase().includes('.env.sample') ||
          f.path.toLowerCase().includes('.env.template')
      );

    if (hasEnvExample) {
      score += 3;
      evidenceList.push('Environment configuration template present (.env.example)');
    }

    // 3. Lint/formatter/tsconfig/jsconfig tools
    const hygieneConfigs = evidence.configFiles.filter(
      (c) =>
        c.type === 'linter_config' ||
        c.type === 'formatter_config' ||
        c.type === 'typescript_config' ||
        c.path.toLowerCase().includes('.eslintrc') ||
        c.path.toLowerCase().includes('eslint.config') ||
        c.path.toLowerCase().includes('.prettierrc') ||
        c.path.toLowerCase().includes('tsconfig') ||
        c.path.toLowerCase().includes('jsconfig')
    );

    if (hygieneConfigs.length > 0) {
      score += 3;
      const uniqueTools = Array.from(new Set(hygieneConfigs.map((c) => c.path))).join(', ');
      evidenceList.push(`Configuration hygiene tools detected (${uniqueTools})`);
    }

    score = Math.min(maxScore, score);
    if (evidenceList.length === 0) {
      if (this.isEvidenceIncomplete(evidence)) {
        evidenceList.push('Configuration hygiene indicators were not observed in the available repository evidence.');
      } else {
        evidenceList.push('Configuration hygiene files (.gitignore, .env.example, linter configs) were absent from the repository.');
      }
    }

    return {
      name: 'Configuration Hygiene',
      score,
      maxScore,
      status: this.calculateStatus(score, maxScore),
      evidence: evidenceList
    };
  }

  /**
   * 8. Maintenance Signal (Max 10 Points)
   */
  private evaluateMaintenance(evidence: RepositoryEvidencePackage): HealthCategoryScore {
    const maxScore = 10;
    let score = 0;
    const evidenceList: string[] = [];

    // 1. Archival & Operational Status (Max 2 pts)
    const isArchived = Boolean(evidence.repository.archived);
    const isDisabled = Boolean(evidence.repository.disabled);

    if (!isArchived) {
      score += 1;
      evidenceList.push('Repository status is active (not archived)');
    } else {
      evidenceList.push('Repository is archived');
    }

    if (!isDisabled) {
      score += 1;
      evidenceList.push('Repository status is operational (not disabled)');
    } else {
      evidenceList.push('Repository is disabled');
    }

    // 2. Recent Commit/Push Activity Weighting (Max 5 pts)
    const pushedTimestamp = evidence.repository.pushedAt || evidence.repository.updatedAt;

    if (pushedTimestamp) {
      const pushedDate = new Date(pushedTimestamp);
      const now = new Date();
      const diffMs = now.getTime() - pushedDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (!isNaN(pushedDate.getTime())) {
        if (diffDays <= 90) {
          score += 5;
          evidenceList.push(`Recent push activity detected within past 90 days (${pushedTimestamp.split('T')[0]})`);
        } else if (diffDays <= 180) {
          score += 4;
          evidenceList.push(`Push activity detected within past 6 months (${pushedTimestamp.split('T')[0]})`);
        } else if (diffDays <= 365) {
          score += 3;
          evidenceList.push(`Push activity detected within past year (${pushedTimestamp.split('T')[0]})`);
        } else if (diffDays <= 730) {
          score += 2;
          evidenceList.push(`Push activity detected within past 2 years (${pushedTimestamp.split('T')[0]})`);
        } else {
          score += 1;
          evidenceList.push(`Last push activity observed over 2 years ago (${pushedTimestamp.split('T')[0]})`);
        }
      } else {
        score += 2;
        evidenceList.push('Repository push activity timestamp unparseable');
      }
    } else {
      score += 2;
      evidenceList.push('Repository push activity timestamp not observed in evidence package');
    }

    // 3. Issue Management Metadata (Max 3 pts)
    const openIssues = evidence.repository.openIssues;
    if (typeof openIssues === 'number' && openIssues >= 0) {
      score += 2;
      evidenceList.push(`Issue tracking metadata available (${openIssues} open issues)`);

      if (openIssues < 100) {
        score += 1;
        evidenceList.push('Open issue count is within manageable bounds (< 100 open issues)');
      }
    } else {
      score += 1;
      evidenceList.push('Issue tracking count not observed in evidence package');
    }

    score = Math.min(maxScore, score);

    return {
      name: 'Maintenance',
      score,
      maxScore,
      status: this.calculateStatus(score, maxScore),
      evidence: evidenceList
    };
  }
}

export const healthService = new HealthService();
