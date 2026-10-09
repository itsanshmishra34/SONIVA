import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { getFirestore } from 'firebase-admin/firestore';
import { Incident } from './incident-tracker.ts';

async function migrate() {
  const filePath = path.resolve(process.cwd(), 'data', 'incidents.json');
  if (!existsSync(filePath)) {
    console.log('No incidents.json found. Nothing to migrate.');
    return;
  }

  console.log('Migrating incidents from JSON to Firestore...');
  const data = JSON.parse(readFileSync(filePath, 'utf8')) as Incident[];
  
  const db = getFirestore();
  const col = db.collection('incidents');
  const batch = db.batch();

  for (const incident of data) {
    batch.set(col.doc(incident.id), incident);
  }
  
  await batch.commit();
  console.log(`Successfully migrated ${data.length} incidents.`);
  
  // Do NOT delete the original file as per instructions
  console.log('Original file kept for retention policy.');
}

migrate().catch(console.error);
