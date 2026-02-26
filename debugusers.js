import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { app } from './src/config/firebase.ts'; // assuming this works?
import * as dotenv from 'dotenv';
dotenv.config();

const db = getFirestore(app);

async function run() {
    const snap = await getDocs(collection(db, 'USERS'));
    snap.docs.forEach(d => {
        console.log("ID:", d.id, "Data:", d.data().mainCharacter?.name, d.data().playerToken);
    });
}
run();
