export type FailureCategory =
  | 'TypeScript'
  | 'ESLint'
  | 'dependency'
  | 'test'
  | 'build'
  | 'configuration'
  | 'runtime'
  | 'API'
  | 'deployment'
  | 'infrastructure'
  | 'IAM'
  | 'network';

export interface NormalizedError {
  stage: string;
  category: FailureCategory;
  command: string;
  exitCode: number;
  errorMessage: string;
  stack?: string;
  affectedFiles?: string[];
  timestamp: string;
  commitSha: string;
}

export interface SelfHealAttempt {
  attemptNumber: number;
  targetStage: string;
  category: FailureCategory;
  diagnosis: string;
  filesChanged: string[];
  testsBeforeRepair: 'PASS' | 'FAIL' | 'NOT_RUN';
  testsAfterRepair: 'PASS' | 'FAIL' | 'NOT_RUN';
  resolved: boolean;
  timestamp: string;
}

export interface AuditRecord {
  id: string;
  commitSha: string;
  error: NormalizedError;
  diagnosis: string;
  patchSummary: string;
  filesChanged: string[];
  testsBeforeRepair: string;
  testsAfterRepair: string;
  deploymentResult?: string;
  rollbackResult?: string;
  timestamp: string;
}

export interface StageResult {
  stage: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'BLOCKED';
  durationMs: number;
  error?: NormalizedError;
}

export interface CIPipelineSummary {
  commitSha: string;
  branch: string;
  stages: Record<string, 'PASS' | 'FAIL' | 'SKIPPED' | 'BLOCKED'>;
  selfHealing: {
    attempts: SelfHealAttempt[];
    status: 'NOT_NEEDED' | 'RESOLVED' | 'SELF_HEALING_BLOCKED';
    reason?: string;
  };
  deployment: {
    status: 'PASS' | 'FAIL' | 'SKIPPED' | 'ROLLED_BACK';
    revision?: string;
  };
  finalStatus: 'PRODUCTION READY' | 'DEPLOYMENT_FAILED' | 'SELF_HEALING_BLOCKED' | 'CI_FAILED';
}
