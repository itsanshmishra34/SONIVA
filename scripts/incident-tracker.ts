import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getFirestore } from 'firebase-admin/firestore';

export interface Incident {
  id: string;
  firstSeen: string;
  lastSeen: string;
  env: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  message: string;
  subsystem: string;
  correlationId: string;
  count: number;
  status: 'OPEN' | 'INVESTIGATING' | 'FIX_PROPOSED' | 'VERIFIED' | 'RESOLVED' | 'ESCALATED';
}

// Storage Interface
export interface IncidentStorage {
  load(): Promise<Incident[]>;
  save(incidents: Incident[]): Promise<void>;
}

// Local File Implementation (For Dev/Test only)
const STORAGE_PATH = path.resolve(process.cwd(), 'data', 'incidents.json');
class FileStorage implements IncidentStorage {
  async load(): Promise<Incident[]> {
    const dir = path.dirname(STORAGE_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(STORAGE_PATH)) return [];
    try {
      return JSON.parse(readFileSync(STORAGE_PATH, 'utf8'));
    } catch {
      return [];
    }
  }
  async save(incidents: Incident[]): Promise<void> {
    const dir = path.dirname(STORAGE_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(STORAGE_PATH, JSON.stringify(incidents, null, 2), 'utf8');
  }
}

// Firestore Implementation (For Production)
export class FirestoreStorage implements IncidentStorage {
  private db = getFirestore();
  private col = this.db.collection('incidents');

  async load(): Promise<Incident[]> {
    const snapshot = await this.col.get();
    return snapshot.docs.map(doc => doc.data() as Incident);
  }
  async save(incidents: Incident[]): Promise<void> {
    const batch = this.db.batch();
    for (const incident of incidents) {
      batch.set(this.col.doc(incident.id), incident);
    }
    await batch.commit();
  }
  
  // Controlled Write/Read Check
  async verify(): Promise<boolean> {
    const testId = 'test-verification-doc';
    const testDoc = this.col.doc(testId);
    try {
      await testDoc.set({ id: testId, timestamp: Date.now() });
      const snap = await testDoc.get();
      const success = snap.exists;
      await testDoc.delete();
      return success;
    } catch {
      return false;
    }
  }
}

export function getStorage(): IncidentStorage {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return new FirestoreStorage();
  }
  return new FileStorage();
}

export async function reportIncident(incident: Omit<Incident, 'id' | 'firstSeen' | 'lastSeen' | 'count' | 'status'>): Promise<Incident> {
  const storage = getStorage();
  const incidents = await storage.load();
  const existing = incidents.find(i => i.message === incident.message && i.status !== 'RESOLVED');

  if (existing) {
    existing.count += 1;
    existing.lastSeen = new Date().toISOString();
    await storage.save(incidents);
    return existing;
  }

  const newIncident: Incident = {
    ...incident,
    id: `inc-${Date.now()}`,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    count: 1,
    status: 'OPEN'
  };
  incidents.push(newIncident);
  await storage.save(incidents);
  return newIncident;
}

export async function clear() {
  const storage = getStorage();
  await storage.save([]);
}
