/**
 * WarcraftLogs API Service
 * Uses backend proxy to fetch raid participants
 */

const WCL_PROXY_URL = 'https://digitan.cl/api/hell/blizzard_api/wcl_proxy.php';

interface Participant {
    name: string;
    realm?: string;
}

interface WCLProxyResponse {
    success: boolean;
    participants?: Participant[];
    count?: number;
    error?: string;
}

export const warcraftLogsService = {
    /**
     * Extract report code from WarcraftLogs URL
     * Example: https://www.warcraftlogs.com/reports/ABC123xyz -> ABC123xyz
     */
    extractReportCode(url: string): string | null {
        try {
            // Support multiple URL formats:
            // https://www.warcraftlogs.com/reports/ABC123xyz
            // https://classic.warcraftlogs.com/reports/ABC123xyz
            // ABC123xyz (direct code)

            const match = url.match(/\/reports\/([a-zA-Z0-9]+)/);
            if (match) {
                return match[1];
            }

            // Check if it's already a code (alphanumeric, typically 16 chars)
            if (/^[a-zA-Z0-9]{10,20}$/.test(url.trim())) {
                return url.trim();
            }

            return null;
        } catch (error) {
            console.error('Error extracting report code:', error);
            return null;
        }
    },

    /**
     * Fetch participants from a WarcraftLogs report via backend proxy
     */
    async getReportParticipants(reportCode: string): Promise<Participant[]> {
        try {
            const response = await fetch(`${WCL_PROXY_URL}?report_code=${encodeURIComponent(reportCode)}`);

            if (!response.ok) {
                throw new Error(`Proxy request failed: ${response.status}`);
            }

            const result: WCLProxyResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Error desconocido del proxy');
            }

            // BACKWARD COMPATIBILITY: Handle case where PHP proxy returns array of strings (old version)
            const rawParticipants = result.participants || [];
            if (rawParticipants.length > 0 && typeof rawParticipants[0] === 'string') {
                console.warn("WCL Proxy returned strings. Please update wcl_proxy.php to support Realms.");
                return (rawParticipants as any[]).map((name: string) => ({ name, realm: undefined }));
            }

            return rawParticipants as Participant[];
        } catch (error: any) {
            console.error('Error fetching WCL report:', error);
            throw new Error(error.message || 'Error al consultar WarcraftLogs');
        }
    },

    /**
     * Main method: Parse URL and get participants
     */
    async getParticipantsFromUrl(url: string): Promise<Participant[]> {
        const reportCode = this.extractReportCode(url);

        if (!reportCode) {
            throw new Error('URL inválida. Formato esperado: https://www.warcraftlogs.com/reports/ABC123xyz');
        }

        return await this.getReportParticipants(reportCode);
    },
};
