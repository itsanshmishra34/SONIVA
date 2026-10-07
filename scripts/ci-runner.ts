import { execSync, spawn, ChildProcess } from 'child_process';
import { SelfHealingEngine, classifyError } from './self-heal';
import { NormalizedError, StageResult, CIPipelineSummary } from './ci-types';
import { deployCandidate } from './deploy';

interface PipelineStageDef {
  name: string;
  command: string;
  summaryLabel: string;
}

const STAGES: PipelineStageDef[] = [
  { name: 'Environment Validation', command: 'npx tsx scripts/env-validator.ts', summaryLabel: 'Environment' },
  { name: 'TypeScript Typecheck', command: 'npx tsc --noEmit', summaryLabel: 'Typecheck' },
  { name: 'Lint', command: 'npm run lint', summaryLabel: 'Lint' },
  { name: 'Regression Tests', command: 'npx tsx --test tests/**/*.test.ts', summaryLabel: 'Tests' },
  { name: 'Production Build', command: 'npm run build', summaryLabel: 'Build' },
  { name: 'Security Audit', command: 'npx tsx scripts/security-check.ts', summaryLabel: 'Security' },
  { name: 'Runtime Smoke Test', command: 'npx tsx scripts/smoke-test.ts', summaryLabel: 'Smoke Test' }
];

export async function runCIPipeline(): Promise<CIPipelineSummary> {
  const commitSha = process.env.GITHUB_SHA || '7b3e19a';
  const branch = process.env.GITHUB_REF_NAME || 'main';
  const selfHealer = new SelfHealingEngine();

  const stageResults: Record<string, 'PASS' | 'FAIL' | 'SKIPPED' | 'BLOCKED'> = {};
  let overallFailed = false;
  let selfHealStatus: 'NOT_NEEDED' | 'RESOLVED' | 'SELF_HEALING_BLOCKED' = 'NOT_NEEDED';
  let selfHealReason: string | undefined;

  console.log('==================================================');
  console.log(`SONIVA CI/CD PIPELINE EXECUTION`);
  console.log(`Commit : ${commitSha}`);
  console.log(`Branch : ${branch}`);
  console.log('==================================================');

  for (const stage of STAGES) {
    if (overallFailed) {
      stageResults[stage.summaryLabel] = 'BLOCKED';
      continue;
    }

    console.log(`\n▶ [CI_STAGE] ${stage.name} (${stage.command})`);
    const start = Date.now();

    let runtimeServer: ChildProcess | undefined;

    const stopRuntimeServer = () => {
      if (runtimeServer && !runtimeServer.killed) {
        runtimeServer.kill('SIGTERM');
      }
      runtimeServer = undefined;
    };

    try {
      if (stage.summaryLabel === 'Smoke Test') {
        const port = process.env.PORT || '3000';
        console.log(`[RUNTIME] Starting production server for smoke test on port ${port}...`);
        runtimeServer = spawn('npx', ['tsx', 'server.ts'], {
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'production', PORT: port },
          shell: false
        });

        const smokeUrl = `http://127.0.0.1:${port}`;
        const deadline = Date.now() + 15000;
        let ready = false;
        while (Date.now() < deadline) {
          try {
            const res = await fetch(`${smokeUrl}/api/health`);
            if (res.ok) {
              ready = true;
              break;
            }
          } catch {
            // Server is still starting.
          }
          await new Promise(resolve => setTimeout(resolve, 250));
        }

        if (!ready) {
          stopRuntimeServer();
          throw new Error(`Production server did not become ready on ${smokeUrl} within 15s`);
        }

        console.log('[RUNTIME] Production server is ready. Running smoke test...');
        process.env.TARGET_URL = smokeUrl;
        execSync(stage.command, { stdio: 'inherit', env: process.env });
        stopRuntimeServer();
      } else {
        execSync(stage.command, { stdio: 'inherit' });
      }

      stageResults[stage.summaryLabel] = 'PASS';
      console.log(`✔ [CI_STAGE_SUCCESS] ${stage.name} passed in ${Date.now() - start}ms`);
    } catch (err: any) {
      stopRuntimeServer();
      const exitCode = err.status || 1;
      const errorOutput = err.stderr ? err.stderr.toString() : (err.message || String(err));
      console.error(`✖ [CI_STAGE_FAILURE] ${stage.name} failed with exit code ${exitCode}`);

      stageResults[stage.summaryLabel] = 'FAIL';
      overallFailed = true;

      const normalizedError: NormalizedError = {
        stage: stage.name,
        category: classifyError(errorOutput, stage.name),
        command: stage.command,
        exitCode,
        errorMessage: errorOutput,
        timestamp: new Date().toISOString(),
        commitSha
      };

      console.log('\n[CI_ORCHESTRATOR] Triggering Autonomous Bounded Self-Healing Engine...');
      const repairResult = await selfHealer.attemptRepair(normalizedError, stage.command);

      if (repairResult.status === 'RESOLVED') {
        stageResults[stage.summaryLabel] = 'PASS';
        overallFailed = false;
        selfHealStatus = 'RESOLVED';
        selfHealReason = repairResult.message;
        console.log(`✔ [CI_RECOVERY] Self-healing resolved ${stage.name}! Continuing pipeline.`);
      } else {
        selfHealStatus = 'SELF_HEALING_BLOCKED';
        selfHealReason = repairResult.message;
        console.warn(`✖ [CI_BLOCKED] Self-healing could not resolve error. Halting pipeline.`);
        break;
      }
    }
  }

  // Deployment Stage
  let deploymentStatus: 'PASS' | 'FAIL' | 'SKIPPED' | 'ROLLED_BACK' = 'SKIPPED';
  let deployedRevision: string | undefined;

  if (!overallFailed) {
    console.log('\n▶ [CI_STAGE] Production Candidate Deployment & Verification');
    const deployResult = await deployCandidate(`soniva-${commitSha.substring(0, 7)}`);

    if (deployResult.success) {
      stageResults['Health Check'] = 'PASS';
      stageResults['Deployment'] = 'PASS';
      deploymentStatus = 'PASS';
      deployedRevision = deployResult.revision;
    } else {
      stageResults['Health Check'] = 'FAIL';
      stageResults['Deployment'] = 'FAIL';
      deploymentStatus = deployResult.rolledBack ? 'ROLLED_BACK' : 'FAIL';
      overallFailed = true;
    }
  } else {
    stageResults['Health Check'] = 'BLOCKED';
    stageResults['Deployment'] = 'BLOCKED';
  }

  const finalStatus: CIPipelineSummary['finalStatus'] = overallFailed
    ? (selfHealStatus === 'SELF_HEALING_BLOCKED' ? 'SELF_HEALING_BLOCKED' : 'CI_FAILED')
    : 'PRODUCTION READY';

  const summary: CIPipelineSummary = {
    commitSha,
    branch,
    stages: stageResults,
    selfHealing: {
      attempts: [],
      status: selfHealStatus,
      reason: selfHealReason
    },
    deployment: {
      status: deploymentStatus,
      revision: deployedRevision
    },
    finalStatus
  };

  // Render strict summary report format required by specification
  console.log('\n==================================================');
  console.log('SONIVA CI/CD');
  console.log('');
  console.log(`Commit: ${commitSha}`);
  console.log(`Branch: ${branch}`);
  console.log('');
  for (const [key, val] of Object.entries(stageResults)) {
    console.log(`${key.padEnd(16)} ${val}`);
  }
  console.log('');
  if (selfHealStatus !== 'NOT_NEEDED') {
    console.log('Self-Healing:');
    console.log(`Status: ${selfHealStatus}`);
    if (selfHealReason) console.log(`Note  : ${selfHealReason}`);
    console.log('');
  }
  console.log('Final:');
  console.log(finalStatus);
  console.log('==================================================');

  return summary;
}

if (process.argv[1]?.endsWith('ci-runner.ts') || process.argv[1]?.endsWith('ci-runner.js')) {
  runCIPipeline()
    .then(summary => {
      const exitCode = summary.finalStatus === 'PRODUCTION READY' ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(err => {
      console.error('Fatal CI runner exception:', err);
      process.exit(1);
    });
}
