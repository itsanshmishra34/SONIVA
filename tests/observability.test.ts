import { reportIncident, clear } from '../scripts/incident-tracker.ts';
import assert from 'assert';

async function testObservability() {
  console.log('Running observability tests...');
  clear(); // Ensure clean state

  // Test 1: Deduplication
  const msg = 'Test error message';
  const i1 = await reportIncident({ env: 'test', severity: 'LOW', category: 'test', message: msg, subsystem: 'test', correlationId: 'test-1' });
  const i2 = await reportIncident({ env: 'test', severity: 'LOW', category: 'test', message: msg, subsystem: 'test', correlationId: 'test-2' });

  assert.strictEqual(i1.id, i2.id, 'Incident should be deduplicated');
  assert.strictEqual(i2.count, 2, 'Incident count should increase');
  console.log('✔ Deduplication test passed');

  // Test 2: Incident storage check
  assert.ok(i1.id, 'Incident should have an ID');
  console.log('✔ Incident storage test passed');

  console.log('All tests passed!');
}

testObservability().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
