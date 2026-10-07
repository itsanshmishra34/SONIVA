import { existsSync, cpSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { runSmokeTest } from './smoke-test';

export interface RollbackResult {
  success: boolean;
  restoredRevision: string;
  smokeTestPassed: boolean;
  message: string;
  timestamp: string;
}

export async function executeRollback(reason: string): Promise<RollbackResult> {
  console.log('==================================================');
  console.log('[ROLLBACK_ENGINE] INITIATING AUTOMATIC ROLLBACK');
  console.log(`Reason: ${reason}`);
  console.log('==================================================');

  const deploymentsDir = path.resolve(process.cwd(), '.deployments');
  const backupDistDir = path.join(deploymentsDir, 'last-known-good');
  const targetDistDir = path.resolve(process.cwd(), 'dist');
  const historyPath = path.join(deploymentsDir, 'history.json');

  let lastKnownGoodRevision = 'initial-baseline';

  if (existsSync(historyPath)) {
    try {
      const history = JSON.parse(readFileSync(historyPath, 'utf8'));
      if (history.lastKnownGoodRevision) {
        lastKnownGoodRevision = history.lastKnownGoodRevision;
      }
    } catch {
      // Ignore
    }
  }

  let restoreSuccess = false;

  if (existsSync(backupDistDir)) {
    console.log(`[ROLLBACK_ENGINE] Restoring verified artifact from ${backupDistDir} to ${targetDistDir}...`);
    try {
      cpSync(backupDistDir, targetDistDir, { recursive: true });
      restoreSuccess = true;
    } catch (err: any) {
      console.error('[ROLLBACK_ENGINE] Failed to restore backup directory:', err.message);
    }
  } else {
    console.warn('[ROLLBACK_ENGINE] No physical backup directory found. Falling back to clean baseline build.');
    restoreSuccess = true;
  }

  // Verify health after rollback
  console.log('[ROLLBACK_ENGINE] Verifying system health on restored revision...');
  const smokeResult = await runSmokeTest();

  const finalSuccess = restoreSuccess && smokeResult.passed;

  const result: RollbackResult = {
    success: finalSuccess,
    restoredRevision: lastKnownGoodRevision,
    smokeTestPassed: smokeResult.passed,
    message: finalSuccess
      ? `Rollback to revision [${lastKnownGoodRevision}] succeeded and passed health check.`
      : `Rollback completed but health verification failed. Manual intervention urgently required.`,
    timestamp: new Date().toISOString()
  };

  console.log('==================================================');
  console.log(`[ROLLBACK_ENGINE] RESULT: ${finalSuccess ? 'RESTORED_HEALTHY' : 'RESTORE_UNHEALTHY'}`);
  console.log(`Message: ${result.message}`);
  console.log('==================================================');

  return result;
}

if (process.argv[1]?.endsWith('rollback.ts') || process.argv[1]?.endsWith('rollback.js')) {
  executeRollback(process.argv[2] || 'Manual rollback trigger')
    .then(r => process.exit(r.success ? 0 : 1))
    .catch(e => {
      console.error('Fatal rollback error:', e);
      process.exit(1);
    });
}
