import axios from 'axios';

export interface StreamerStatus {
    name: string;
    platform: 'twitch' | 'kick';
    isLive: boolean;
    metadata?: any;
    error?: boolean;
}

const FUNCTIONS_URL = 'https://us-central1-hellheim-guild.cloudfunctions.net'; // Ajustar según el ID de proyecto real si es necesario

export const streamService = {
    async getStatuses(streamers: { name: string, platform: 'twitch' | 'kick' }[]): Promise<StreamerStatus[]> {
        try {
            // En desarrollo local o si el usuario no ha desplegado, podemos fallar con elegancia
            const response = await axios.post(`${FUNCTIONS_URL}/getStreamerStatus`, { streamers });
            return response.data;
        } catch (error) {
            console.warn("Error al obtener estados de streamers (es posible que la función no esté desplegada):", error);
            // Retornar todos como 'live' por defecto para no romper la visualización actual si falla el backend
            return streamers.map(s => ({ ...s, isLive: true }));
        }
    }
};
