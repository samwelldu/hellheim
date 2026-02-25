import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as corsLib from "cors";

// Initialize Firebase Admin
admin.initializeApp();

const cors = corsLib({ origin: true });

// Blizzard API Configuration (Stored via Secrets)
// Use: firebase functions:secrets:set BLIZZARD_CLIENT_ID
// Use: firebase functions:secrets:set BLIZZARD_CLIENT_SECRET

/**
 * Get Blizzard OAuth2 Token
 */
async function getBlizzardToken(): Promise<string> {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing Blizzard API credentials in environment (Secrets).");
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post('https://oauth.battle.net/token',
        'grant_type=client_credentials',
        {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );

    return response.data.access_token;
}

/**
 * Force Sync Character Data from Blizzard
 */
export const syncCharacterData = functions.runWith({
    secrets: ["BLIZZARD_CLIENT_ID", "BLIZZARD_CLIENT_SECRET"]
}).https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const { characterName, realm, region = 'us' } = req.body;

        if (!characterName || !realm) {
            res.status(400).send('Missing characterName or realm');
            return;
        }

        try {
            const token = await getBlizzardToken();

            // 1. Fetch Profile Summary (iLvl)
            const profileUrl = `https://${region}.api.blizzard.com/profile/wow/character/${realm.toLowerCase()}/${characterName.toLowerCase()}?namespace=profile-${region}&locale=en_US&access_token=${token}`;
            const profileRes = await axios.get(profileUrl);
            const profileData = profileRes.data;

            // 2. Fetch Mythic+ Weekly Best (Placeholder logic for future expansion)
            // const mPlusUrl = `https://${region}.api.blizzard.com/profile/wow/character/${realm.toLowerCase()}/${characterName.toLowerCase()}/mythic-keystone-profile/keystone-profile-index?namespace=profile-${region}&locale=en_US&access_token=${token}`;

            // await axios.get(mPlusUrl); // Future implementation

            // Update Firestore
            const charRef = admin.firestore().collection('mythic_progress').doc(`${characterName}-${realm}`);

            const updateData = {
                ilvl: Math.floor(profileData.equipped_item_level || 0),
                className: profileData.character_class.name,
                spec: profileData.active_spec.name,
                level: profileData.level,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                // weeklyHistory: ... (logic to parse keystones will go here)
            };

            await charRef.set(updateData, { merge: true });

            res.status(200).json({ success: true, data: updateData });
        } catch (error: any) {
            console.error("Sync Error:", error.response?.data || error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });
});
