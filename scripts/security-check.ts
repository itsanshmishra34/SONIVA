import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

export interface SecurityFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  file: string;
  description: string;
}

export interface SecurityCheckResult {
  passed: boolean;
  findings: SecurityFinding[];
  scannedFilesCount: number;
  summary: string;
}

// Patterns that identify real private secrets (not public Firebase client configs)
const PRIVATE_SECRET_PATTERNS = [
  {
    category: 'EXPOSED_PRIVATE_KEY',
    severity: 'CRITICAL' as const,
    regex: /-----BEGIN\s+(RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/,
    description: 'Found unencrypted private key'
  },
  {
    category: 'SERVICE_ACCOUNT_PRIVATE_KEY',
    severity: 'CRITICAL' as const,
    regex: /"type":\s*"service_account"[\s\S]*"private_key":\s*"-----BEGIN/,
    description: 'Found raw service account private key JSON'
  },
  {
    category: 'HARDCODED_SECRET_KEY',
    severity: 'HIGH' as const,
    regex: /(?:aws_secret_access_key|api_secret|client_secret)\s*[:=]\s*['"][A-Za-z0-9/+=]{30,}['"]/i,
    description: 'Found hardcoded private API secret'
  },
  {
    category: 'MOCK_AUTH_IN_PRODUCTION',
    severity: 'HIGH' as const,
    regex: /(?:BYPASS_AUTH|DISABLE_AUTH|MOCK_AUTH)\s*=\s*true/i,
    description: 'Found insecure mock authentication bypass in production logic'
  }
];

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.cache'
]);

function walkDirectory(dir: string, fileList: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;
    const fullPath = path.join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walkDirectory(fullPath, fileList);
      } else if (stat.isFile()) {
        // Only inspect code, config, and text files
        if (/\.(ts|tsx|js|mjs|cjs|json|env|md|html|yml|yaml)$/i.test(entry)) {
          fileList.push(fullPath);
        }
      }
    } catch {
      // Ignore unreadable entries
    }
  }
  return fileList;
}

export function runSecurityCheck(): SecurityCheckResult {
  const rootDir = process.cwd();
  const files = walkDirectory(rootDir);
  const findings: SecurityFinding[] = [];

  for (const file of files) {
    const relPath = path.relative(rootDir, file);
    
    // Avoid self-flagging security-check.ts for pattern definitions
    if (relPath.includes('security-check.ts')) continue;

    try {
      const content = readFileSync(file, 'utf8');

      for (const pattern of PRIVATE_SECRET_PATTERNS) {
        if (pattern.regex.test(content)) {
          findings.push({
            severity: pattern.severity,
            category: pattern.category,
            file: relPath,
            description: pattern.description
          });
        }
      }
    } catch {
      // Ignore unreadable files
    }
  }

  // Verify that public Firebase client configuration is recognized as legitimate
  const firebaseConfigPath = path.join(rootDir, 'firebase-applet-config.json');
  try {
    const cfg = JSON.parse(readFileSync(firebaseConfigPath, 'utf8'));
    if (cfg.apiKey && !cfg.apiKey.startsWith('AIza')) {
      findings.push({
        severity: 'MEDIUM',
        category: 'SUSPICIOUS_FIREBASE_KEY',
        file: 'firebase-applet-config.json',
        description: 'Firebase API key has unexpected format'
      });
    }
  } catch {
    // Handled in env-validator
  }

  const passed = findings.length === 0;

  return {
    passed,
    findings,
    scannedFilesCount: files.length,
    summary: passed
      ? `PASS: ${files.length} files scanned with 0 critical or high security findings.`
      : `FAIL: ${findings.length} security findings identified.`
  };
}

if (process.argv[1]?.endsWith('security-check.ts') || process.argv[1]?.endsWith('security-check.js')) {
  const result = runSecurityCheck();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('==================================================');
    console.log('SONIVA AUTOMATED SECURITY & VULNERABILITY AUDIT');
    console.log('==================================================');
    console.log(`Files Scanned: ${result.scannedFilesCount}`);
    console.log(`Status       : ${result.passed ? 'SECURE' : 'ACTION_REQUIRED'}`);
    if (result.findings.length > 0) {
      console.log('Findings:');
      for (const f of result.findings) {
        console.log(`  [${f.severity}] ${f.category} in ${f.file}: ${f.description}`);
      }
    } else {
      console.log('No exposed private keys, unencrypted secrets, or auth bypass flags detected.');
      console.log('Public Firebase Web SDK credentials safely distinguished from private server secrets.');
    }
    console.log('==================================================');
    console.log(`SUMMARY: ${result.summary}`);
    console.log('==================================================');
  }

  process.exit(result.passed ? 0 : 1);
}
