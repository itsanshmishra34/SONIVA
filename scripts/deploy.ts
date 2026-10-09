import { existsSync, cpSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { runSmokeTest } from './smoke-test';
import { executeRollback } from './rollback';
import { reportIncident } from './incident-tracker';
import { sendAlert } from './alert-interface';

export interface DeploymentResult {
  success: boolean;
  revision: string;
  smokeTestPassed: boolean;
  rolledBack: boolean;
  message: string;
  timestamp: string;
}

export async function deployCandidate(revisionId?: string): Promise<DeploymentResult> {
  const currentRevision = revisionId || `rev-${Date.now().toString(36)}`;
  console.log('==================================================');
  console.log(`[DEPLOYMENT_ENGINE] STARTING DEPLOYMENT: ${currentRevision}`);
  console.log('==================================================');

  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const deploymentsDir = path.join(rootDir, '.deployments');
  const backupDistDir = path.join(deploymentsDir, 'last-known-good');
  const historyPath = path.join(deploymentsDir, 'history.json');

  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir, { recursive: true });
  }

  // 1. Verify build artifact exists
  if (!existsSync(distDir) || !existsSync(path.join(distDir, 'index.html'))) {
    console.log('[DEPLOYMENT_ENGINE] Artifact dist/ not found. Executing production build...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (err: any) {
      const incident = await reportIncident({
        env: 'production',
        severity: 'CRITICAL',
        category: 'build',
        message: `Production build failed: ${err.message}`,
        subsystem: 'deployment',
        correlationId: currentRevision
      });
      sendAlert(incident);
      throw err;
    }
  }

  // 2. Candidate Health Check
  console.log('[DEPLOYMENT_ENGINE] Executing automated post-deployment smoke test on candidate...');
  const smokeResult = await runSmokeTest();

  if (smokeResult.passed) {
    console.log('[DEPLOYMENT_ENGINE] Post-deployment smoke test passed! Archiving as last-known-good revision...');
    try {
      cpSync(distDir, backupDistDir, { recursive: true });

      const historyRecord = {
        lastKnownGoodRevision: currentRevision,
        deployedAt: new Date().toISOString(),
        status: 'LIVE'
      };
      writeFileSync(historyPath, JSON.stringify(historyRecord, null, 2), 'utf8');
    } catch (err: any) {
      console.warn('[DEPLOYMENT_ENGINE] Backup sync warning:', err.message);
    }

    console.log('==================================================');
    console.log(`[DEPLOYMENT_ENGINE] DEPLOYMENT SUCCESSFUL: ${currentRevision}`);
    console.log('Status: LIVE & HEALTHY');
    console.log('==================================================');

    return {
      success: true,
      revision: currentRevision,
      smokeTestPassed: true,
      rolledBack: false,
      message: `Revision ${currentRevision} promoted and verified healthy.`,
      timestamp: new Date().toISOString()
    };
  } else {
    console.error('==================================================');
    console.error('[DEPLOYMENT_ENGINE] POST-DEPLOYMENT HEALTH CHECK FAILED!');
    console.error('Triggering automatic rollback to last-known-good revision...');
    console.error('==================================================');

    const incident = await reportIncident({
      env: 'production',
      severity: 'CRITICAL',
      category: 'deployment',
      message: `Post-deployment smoke test failed for ${currentRevision}`,
      subsystem: 'deployment',
      correlationId: currentRevision
    });
    sendAlert(incident);

    const rollbackResult = await executeRollback(`Candidate ${currentRevision} failed post-deployment smoke tests`);

    return {
      success: false,
      revision: currentRevision,
      smokeTestPassed: false,
      rolledBack: true,
      message: `Candidate ${currentRevision} failed post-deploy checks. Rolled back: ${rollbackResult.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

if (process.argv[1]?.endsWith('deploy.ts') || process.argv[1]?.endsWith('deploy.js')) {
  deployCandidate(process.argv[2])
    .then(r => process.exit(r.success ? 0 : 1))
    .catch(e => {
      console.error('Fatal deployment execution error:', e);
      process.exit(1);
    });
}
