import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  NormalizedError,
  FailureCategory,
  SelfHealAttempt,
  AuditRecord
} from './ci-types';

export const MAX_REPAIR_ATTEMPTS = 3;

// Protected resources that must NEVER be modified by autonomous self-healing
const PROTECTED_RESOURCES = [
  'firestore.rules',
  'firebase-blueprint.json',
  'server-identity',
  'iam-policy',
  'admin-passkeys',
  'billing',
  'crypto',
  'private-key'
];

export function classifyError(errorOutput: string, stage: string): FailureCategory {
  const lower = errorOutput.toLowerCase();

  if (lower.includes('permission_denied') || lower.includes('code 7') || lower.includes('iam') || lower.includes('roles/')) {
    return 'IAM';
  }
  if (lower.includes('cannot find module') || lower.includes('err_module_not_found') || lower.includes('enoent') && lower.includes('node_modules')) {
    return 'dependency';
  }
  if (lower.includes('ts2') || lower.includes('typeerror') || lower.includes('tsc --noemit') || lower.includes('syntaxerror')) {
    return 'TypeScript';
  }
  if (lower.includes('eslint') || lower.includes('lint') || lower.includes('prettier')) {
    return 'ESLint';
  }
  if (lower.includes('assertionerror') || lower.includes('subtests failed') || lower.includes('testcodefailure')) {
    return 'test';
  }
  if (lower.includes('vite build') || lower.includes('failed to compile') || lower.includes('rollup')) {
    return 'build';
  }
  if (lower.includes('econnrefused') || lower.includes('timeout') || lower.includes('enotfound')) {
    return 'network';
  }
  if (lower.includes('config') || lower.includes('missing or invalid')) {
    return 'configuration';
  }
  if (stage === 'deployment') {
    return 'deployment';
  }
  return 'runtime';
}

export function isResourceProtected(filePath: string): boolean {
  return PROTECTED_RESOURCES.some(p => filePath.toLowerCase().includes(p));
}

export interface SelfHealResult {
  status: 'RESOLVED' | 'SELF_HEALING_BLOCKED' | 'NOT_APPLICABLE';
  attempts: SelfHealAttempt[];
  message: string;
}

export class SelfHealingEngine {
  private attempts: SelfHealAttempt[] = [];
  private auditLogPath = path.resolve(process.cwd(), 'logs', 'ci-audit.json');

  constructor() {
    const logDir = path.dirname(this.auditLogPath);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  public recordAudit(record: AuditRecord): void {
    let existing: AuditRecord[] = [];
    if (existsSync(this.auditLogPath)) {
      try {
        existing = JSON.parse(readFileSync(this.auditLogPath, 'utf8'));
      } catch {
        existing = [];
      }
    }
    existing.push(record);
    writeFileSync(this.auditLogPath, JSON.stringify(existing, null, 2), 'utf8');
  }

  public async attemptRepair(error: NormalizedError, runVerificationCmd: string): Promise<SelfHealResult> {
    if (error.category === 'IAM') {
      return {
        status: 'SELF_HEALING_BLOCKED',
        attempts: this.attempts,
        message: 'INFRASTRUCTURE_REQUIRES_REVIEW: IAM or permission denied errors require human review and administrator policy grants.'
      };
    }

    if (error.affectedFiles?.some(isResourceProtected)) {
      return {
        status: 'SELF_HEALING_BLOCKED',
        attempts: this.attempts,
        message: 'SAFETY_HALT: Error touches protected security, IAM, or rule files. Automated modification is forbidden.'
      };
    }

    let attemptIndex = this.attempts.length + 1;

    while (attemptIndex <= MAX_REPAIR_ATTEMPTS) {
      console.log(`[SELF_HEAL] Starting repair attempt ${attemptIndex} of ${MAX_REPAIR_ATTEMPTS} for [${error.category}] in stage [${error.stage}]`);

      const diagnosis = `Identified ${error.category} issue in ${error.stage}: ${error.errorMessage.substring(0, 160)}`;
      const filesModified: string[] = [];

      // Deterministic Bounded Repair Strategy
      try {
        if (error.category === 'dependency') {
          console.log('[SELF_HEAL] Executing deterministic dependency verification/re-install...');
          execSync('npm install --prefer-offline', { stdio: 'inherit' });
          filesModified.push('package.json', 'package-lock.json');
        } else if (error.category === 'build' && error.errorMessage.includes('dist')) {
          console.log('[SELF_HEAL] Cleaning stale build artifacts...');
          execSync('rm -rf dist .vite', { stdio: 'inherit' });
          filesModified.push('dist/');
        } else if (error.category === 'TypeScript' || error.category === 'ESLint') {
          console.log('[SELF_HEAL] Inspecting TypeScript/Lint failure...');
          // Trigger typecheck to refresh cache
          execSync('npx tsc --noEmit', { stdio: 'pipe' });
        }
      } catch (patchErr: any) {
        // Patch execution logged
      }

      // Re-run the failed check
      let checkPassed = false;
      try {
        console.log(`[SELF_HEAL] Re-testing failed command: ${runVerificationCmd}`);
        execSync(runVerificationCmd, { stdio: 'pipe' });
        checkPassed = true;
      } catch {
        checkPassed = false;
      }

      // Run full regression suite if check passed
      let regressionPassed = false;
      if (checkPassed) {
        try {
          console.log('[SELF_HEAL] Running SONIVA regression suite to ensure zero unintended side-effects...');
          execSync('npx tsx --test tests/**/*.test.ts', { stdio: 'pipe' });
          regressionPassed = true;
        } catch {
          regressionPassed = false;
        }
      }

      const attemptRecord: SelfHealAttempt = {
        attemptNumber: attemptIndex,
        targetStage: error.stage,
        category: error.category,
        diagnosis,
        filesChanged: filesModified,
        testsBeforeRepair: 'FAIL',
        testsAfterRepair: regressionPassed ? 'PASS' : 'FAIL',
        resolved: checkPassed && regressionPassed,
        timestamp: new Date().toISOString()
      };

      this.attempts.push(attemptRecord);

      this.recordAudit({
        id: `audit-${Date.now()}-${attemptIndex}`,
        commitSha: error.commitSha || 'local-head',
        error,
        diagnosis,
        patchSummary: `Applied bounded automated fix for ${error.category}`,
        filesChanged: filesModified,
        testsBeforeRepair: 'FAIL',
        testsAfterRepair: regressionPassed ? 'PASS' : 'FAIL',
        timestamp: new Date().toISOString()
      });

      if (checkPassed && regressionPassed) {
        console.log(`[SELF_HEAL] Successfully repaired failure on attempt ${attemptIndex}!`);
        return {
          status: 'RESOLVED',
          attempts: this.attempts,
          message: `Repaired successfully in attempt ${attemptIndex}`
        };
      }

      attemptIndex++;
    }

    console.warn(`[SELF_HEAL] Reached maximum attempts (${MAX_REPAIR_ATTEMPTS}) without resolving issue.`);
    return {
      status: 'SELF_HEALING_BLOCKED',
      attempts: this.attempts,
      message: 'SELF_HEALING_BLOCKED: Max bounded attempts exhausted. Manual intervention required.'
    };
  }
}
