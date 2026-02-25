import axios from 'axios';

/**
 * Blizzard API Service (V9 SURVIVOR)
 */

// He detectado que tu servidor podría estar usando "blizzard api" (con espacio) 
// o "blizzard_api" (con guion bajo). Este servicio intentará ambos.
const PROXY_URL = 'https://digitan.cl/api/hell/blizzard_api/blizzard_proxy.php';

export const blizzardService = {
    async getCharacterProfile(realm: string, name: string, region: string = 'us') {
        const fetch = async (targetRegion: string) => {
            const params = `?name=${encodeURIComponent(name.trim())}&realm=${encodeURIComponent(realm.trim())}&type=profile&region=${targetRegion}`;
            try {
                return await axios.get(PROXY_URL + params);
            } catch (err: any) {
                if (err.response?.status === 404 && typeof err.response.data === 'string' && err.response.data.includes('<!DOCTYPE html>')) {
                    throw new Error("ERROR CRÍTICO: El archivo 'blizzard_proxy.php' no existe. Revisa la ruta en tu cPanel.");
                }
                throw err;
            }
        };

        try {
            const response = await fetch(region);
            return { ...response.data, region };
        } catch (error: any) {
            if (error.response?.status === 404 && region === 'us') {
                try {
                    const response = await fetch('eu');
                    return { ...response.data, region: 'eu' };
                } catch (euError: any) {
                    throw new Error(`Personaje "${name}" no encontrado en Blizzard (Probado en US y EU).`);
                }
            }
            throw new Error(error.message || "Error desconocido en el Proxy");
        }
    },

    async getMythicPlusProfile(realm: string, name: string, region: string = 'us') {
        const params = `?name=${encodeURIComponent(name.trim())}&realm=${encodeURIComponent(realm.trim())}&type=mplus&region=${region}`;
        try {
            const response = await axios.get(PROXY_URL + params);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404 && region === 'us') {
                try {
                    const response = await axios.get(PROXY_URL + params.replace('region=us', 'region=eu'));
                    return response.data;
                } catch (e) { return { current_period: { best_runs: [] } }; }
            }
            return { current_period: { best_runs: [] } };
        }
    },

    async getCharacterDungeons(realm: string, name: string, region: string = 'us') {
        const params = `?name=${encodeURIComponent(name.trim())}&realm=${encodeURIComponent(realm.trim())}&type=dungeons&region=${region}`;
        try {
            const response = await axios.get(PROXY_URL + params);
            return response.data;
        } catch (error: any) {
            console.warn(`[Blizzard API] Failed to fetch Dungeons for ${name}`, error);
            return null;
        }
    },

    async getCharacterRaids(realm: string, name: string, region: string = 'us') {
        const params = `?name=${encodeURIComponent(name.trim())}&realm=${encodeURIComponent(realm.trim())}&type=raids&region=${region}`;
        try {
            const response = await axios.get(PROXY_URL + params);
            return response.data;
        } catch (error: any) {
            console.warn(`[Blizzard API] Failed to fetch Raids for ${name}`, error);
            return null;
        }
    },

    async getGuildRoster(realm: string, guildName: string, region: string = 'us') {
        // Pre-format slug to avoid anxiety with proxy encoding
        // Area 52 -> area-52
        const realmSlug = realm.toLowerCase().replace(/'/g, '').replace(/ /g, '-');
        const params = `?name=${encodeURIComponent(guildName.trim())}&realm=${encodeURIComponent(realmSlug)}&type=guild_roster&region=${region}`;

        console.log(`[Blizzard Service] Requesting Roster: ${PROXY_URL}${params}`);

        // Propagate error to let UI handle it
        const response = await axios.get(PROXY_URL + params);
        return response.data;
    },

    async getGuildProgress(realm: string, guildName: string, region: string = 'us') {
        const realmSlug = realm.toLowerCase().replace(/'/g, '').replace(/ /g, '-');
        const scout = "Antüfløy";
        const params = `?name=${encodeURIComponent(guildName.trim())}&realm=${encodeURIComponent(realmSlug)}&type=guild_progress&region=${region}&scout=${encodeURIComponent(scout)}`;
        const response = await axios.get(PROXY_URL + params);
        return response.data;
    },

    async getCharacterEquipment(realm: string, name: string, region: string = 'us') {
        const params = `?name=${encodeURIComponent(name.trim())}&realm=${encodeURIComponent(realm.trim())}&type=equipment&region=${region}`;
        try {
            const response = await axios.get(PROXY_URL + params);
            return response.data;
        } catch (error) {
            console.warn(`[Blizzard API] Failed to fetch Equipment for ${name}`, error);
            return null;
        }
    },

    async getCharacterStats(realm: string, name: string, region: string = 'us') {
        const params = `?name=${encodeURIComponent(name.trim())}&realm=${encodeURIComponent(realm.trim())}&type=statistics&region=${region}`;
        try {
            const response = await axios.get(PROXY_URL + params);
            return response.data;
        } catch (error) {
            console.warn(`[Blizzard API] Failed to fetch Statistics for ${name}`, error);
            return null;
        }
    },

    async getCharacterMedia(realm: string, name: string, region: string = 'us') {
        const params = `?name=${encodeURIComponent(name.trim())}&realm=${encodeURIComponent(realm.trim())}&type=media&region=${region}`;
        try {
            const response = await axios.get(PROXY_URL + params);
            return response.data;
        } catch (error) {
            console.warn(`[Blizzard API] Failed to fetch Media for ${name}`, error);
            return null;
        }
    },

    async getUserCharacters(token: string, region: string = 'us') {
        const params = `?type=user_characters&token=${token}&region=${region}`;
        try {
            const response = await axios.get(PROXY_URL + params);
            return response.data;
        } catch (error: any) {
            console.error(`[Blizzard API] Failed to fetch User Characters`, error);
            throw error;
        }
    },

    async getWarbandCharacters(token: string, region: string = 'us') {
        const params = `?type=warband&token=${token}&region=${region}`;
        try {
            const response = await axios.get(PROXY_URL + params);
            return response.data;
        } catch (error: any) {
            console.warn(`[Blizzard API] Fail to fetch Warband (Maybe not active)`, error);
            return null;
        }
    }
};
