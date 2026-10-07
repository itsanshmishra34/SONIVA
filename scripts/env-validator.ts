import { readFileSync, existsSync } from 'fs';
import path from 'path';

export interface ConfigValidationResult {
  valid: boolean;
  components: Record<string, {
    status: 'CONFIGURED' | 'MISSING' | 'INVALID';
    details?: string;
  }>;
  summary: string;
}

export function validateEnvironment(): ConfigValidationResult {
  const components: Record<string, { status: 'CONFIGURED' | 'MISSING' | 'INVALID'; details?: string }> = {};

  // 1. Firebase Client Configuration
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (existsSync(configPath)) {
      const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
      const hasProjectId = typeof cfg.projectId === 'string' && cfg.projectId.length > 0;
      const hasAppId = typeof cfg.appId === 'string' && cfg.appId.length > 0;
      const hasApiKey = typeof cfg.apiKey === 'string' && cfg.apiKey.length > 0;
      const hasDbId = typeof cfg.firestoreDatabaseId === 'string' && cfg.firestoreDatabaseId.length > 0;

      if (hasProjectId && hasAppId && hasApiKey && hasDbId) {
        components['FIREBASE_CLIENT_CONFIG'] = { status: 'CONFIGURED' };
      } else {
        components['FIREBASE_CLIENT_CONFIG'] = {
          status: 'INVALID',
          details: 'One or more required Firebase client properties are empty'
        };
      }
    } else {
      components['FIREBASE_CLIENT_CONFIG'] = { status: 'MISSING' };
    }
  } catch (err: any) {
    components['FIREBASE_CLIENT_CONFIG'] = { status: 'INVALID', details: 'Parse failure' };
  }

  // 2. Firebase Admin Configuration
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (existsSync(configPath)) {
      const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
      if (cfg.projectId) {
        // In GCE/Sandbox environments, Admin SDK leverages ADC
        components['FIREBASE_ADMIN_CONFIG'] = { status: 'CONFIGURED' };
      } else {
        components['FIREBASE_ADMIN_CONFIG'] = { status: 'MISSING' };
      }
    } else {
      components['FIREBASE_ADMIN_CONFIG'] = { status: 'MISSING' };
    }
  } catch {
    components['FIREBASE_ADMIN_CONFIG'] = { status: 'INVALID' };
  }

  // 3. YouTube API Configuration
  const rawYtKey = (process.env.YOUTUBE_API_KEY || '').trim();
  if (rawYtKey.length > 0) {
    components['YOUTUBE_API_CONFIG'] = { status: 'CONFIGURED' };
  } else {
    // Graceful fallback to Audius / SoundCloud enabled
    components['YOUTUBE_API_CONFIG'] = {
      status: 'CONFIGURED',
      details: 'Optional provider - graceful fallback to Audius active'
    };
  }

  // 4. Server Configuration
  const port = process.env.PORT || '3000';
  const portNum = parseInt(port, 10);
  if (!isNaN(portNum) && portNum > 0 && portNum <= 65535) {
    components['SERVER_CONFIG'] = { status: 'CONFIGURED' };
  } else {
    components['SERVER_CONFIG'] = { status: 'INVALID', details: 'Invalid PORT' };
  }

  // 5. Deployment Configuration
  const hasPackageJson = existsSync(path.resolve(process.cwd(), 'package.json'));
  const hasViteConfig = existsSync(path.resolve(process.cwd(), 'vite.config.ts'));
  if (hasPackageJson && hasViteConfig) {
    components['DEPLOYMENT_CONFIG'] = { status: 'CONFIGURED' };
  } else {
    components['DEPLOYMENT_CONFIG'] = { status: 'MISSING' };
  }

  const allValid = Object.values(components).every(c => c.status === 'CONFIGURED');

  return {
    valid: allValid,
    components,
    summary: allValid ? 'ALL_CONFIGURATIONS_VALID' : 'CONFIGURATION_CHECK_FAILED'
  };
}

if (process.argv[1]?.endsWith('env-validator.ts') || process.argv[1]?.endsWith('env-validator.js')) {
  const result = validateEnvironment();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('==================================================');
    console.log('SONIVA ENVIRONMENT & CONFIGURATION VALIDATION');
    console.log('==================================================');
    for (const [key, val] of Object.entries(result.components)) {
      console.log(`- ${key.padEnd(26)} : ${val.status}${val.details ? ` (${val.details})` : ''}`);
    }
    console.log('==================================================');
    console.log(`SUMMARY: ${result.summary}`);
    console.log('==================================================');
  }

  process.exit(result.valid ? 0 : 1);
}
