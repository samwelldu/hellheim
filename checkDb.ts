import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    const snap = await getDocs(collection(db, 'mythic_history'));
    console.log(`Found ${snap.docs.length} records in mythic_history`);
    snap.docs.forEach(d => {
        const data = d.data();
        console.log(`ID: ${d.id}, name: ${data.name}, weekNum: ${data.weekNum}, period: ${data.periodId}, globalPerf: ${data.globalPerf}, snapshotAt: ${data.snapshotAt?.toDate ? data.snapshotAt.toDate().toISOString() : data.snapshotAt}`);
    });
    process.exit(0);
}

check();
