import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import configData from '../../firebase-applet-config.json';

// Destructure to ensure clean configuration object for initializeApp
const firebaseConfig = {
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  projectId: configData.projectId,
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
  appId: configData.appId,
  measurementId: configData.measurementId
};

// Singleton-safe Firebase App initialization to protect against HMR re-evaluations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
// Initialize Firestore with named database ID if provided
export const db = getFirestore(app, configData.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

async function testConnection() {
  if (import.meta.env.DEV) {
    try {
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      console.log("[FIREBASE_CONFIG] Firestore connection active.");
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.log("[FIREBASE_CONFIG] Connection verified.");
        return;
      }
      console.info("[FIREBASE_CONFIG] Firestore operating in offline/preview mode: Server backend unreachable or offline.");
    }
  }
}
testConnection();
