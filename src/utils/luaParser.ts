export interface QuotaRecord {
    hash: string;
    dateStr: string;
    timestamp: number;
    name: string;
    amount: number;
    // Auxiliary for UI
    status?: 'new' | 'duplicate' | 'error';
}

/**
 * Parses a raw LUA file content string into structured QuotaRecords.
 * Expected format in LUA:
 * {
 *   ["dateStr"] = "2026-02-12 17:07:51",
 *   ["timestamp"] = 1770926871,
 *   ["name"] = "Antüfløy",
 *   ["amount"] = 10000,
 * },
 */
export const parseLuaTable = (content: string): QuotaRecord[] => {
    const records: QuotaRecord[] = [];

    // Generic block matcher: finds { content } that contains "dateStr"
    // This handles variable whitespace and key order better.
    const blockRegex = /\{[^{}]*\["dateStr"\][^{}]*\}/g;
    const blocks = content.match(blockRegex);

    if (!blocks) return [];

    blocks.forEach(block => {
        try {
            const dateStrMatch = block.match(/\["dateStr"\]\s*=\s*"([^"]+)"/);
            const timestampMatch = block.match(/\["timestamp"\]\s*=\s*(\d+)/);
            const nameMatch = block.match(/\["name"\]\s*=\s*"([^"]+)"/);
            const amountMatch = block.match(/\["amount"\]\s*=\s*(\d+)/);

            if (dateStrMatch && timestampMatch && nameMatch && amountMatch) {
                const dateStr = dateStrMatch[1];
                const timestamp = parseInt(timestampMatch[1], 10);
                const name = nameMatch[1];
                const amount = parseInt(amountMatch[1], 10);

                // Hash Generation Rule:
                // 2026-02-12 17:07:51 -> 2026_02_12_17_07_51
                const dateHash = dateStr.replace(/[-: ]/g, '_');
                const nameHash = name.toLowerCase();

                const hash = `${dateHash}_${timestamp}_${nameHash}_${amount}`;

                records.push({
                    hash,
                    dateStr,
                    timestamp,
                    name,
                    amount,
                    status: 'new'
                });
            }
        } catch (e) {
            console.warn("Parser error on block", e);
        }
    });

    return records;
};
