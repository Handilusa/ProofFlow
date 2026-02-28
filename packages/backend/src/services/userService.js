import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, "../../data/users.json");

let usersCache = {};

function loadUsers() {
    try {
        if (!fs.existsSync(path.dirname(usersFilePath))) {
            fs.mkdirSync(path.dirname(usersFilePath), { recursive: true });
        }
        if (fs.existsSync(usersFilePath)) {
            const data = fs.readFileSync(usersFilePath, "utf8");
            usersCache = JSON.parse(data);
        } else {
            usersCache = {};
            saveUsers();
        }
    } catch (error) {
        console.error("[UserService] Error loading users:", error);
        usersCache = {};
    }
}

function saveUsers() {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(usersCache, null, 2));
    } catch (error) {
        console.error("[UserService] Error saving users:", error);
    }
}

// Initial load
loadUsers();

const ADMIN_WHITELIST = [];

export class UserService {
    /**
     * Gets the profile status including cooldown.
     * @param {string} address The account address (lowercase).
     */
    getProfileStatus(address) {
        if (!address) return { username: null, cooldownDaysLeft: 0 };
        const cleanAddress = address.toLowerCase();
        const entry = usersCache[cleanAddress];

        let username = null;
        let cooldownDaysLeft = 0;

        if (entry) {
            username = typeof entry === 'string' ? entry : entry.username;
            const lastChangedAt = typeof entry === 'string' ? 0 : entry.lastChangedAt || 0;
            const now = Date.now();
            const daysSinceLastChange = (now - lastChangedAt) / (1000 * 60 * 60 * 24);
            const cooldownDays = 90;

            if (daysSinceLastChange < cooldownDays && lastChangedAt > 0 && !ADMIN_WHITELIST.includes(cleanAddress)) {
                cooldownDaysLeft = Math.ceil(cooldownDays - daysSinceLastChange);
            }
        }
        return { username, cooldownDaysLeft };
    }

    /**
     * Gets the username associated with a Hedera or EVM address.
     * @param {string} address The account address (lowercase).
     * @returns {string|null} The username, or null if not found.
     */
    getUsername(address) {
        if (!address) return null;
        const entry = usersCache[address.toLowerCase()];
        if (typeof entry === 'string') return entry; // Legacy support
        return entry ? entry.username : null;
    }

    /**
     * Sets or updates the username for a given address.
     * Enforces a 90-day cooldown between changes.
     * @param {string} address The account address (lowercase).
     * @param {string} username The desired username (max 20 chars).
     */
    setUsername(address, username) {
        if (!address || !username) throw new Error("Address and username are required");

        const cleanAddress = address.toLowerCase();
        const cleanName = username.trim().substring(0, 20); // Basic validation
        const now = Date.now();

        const existingEntry = usersCache[cleanAddress];
        const isWhitelisted = ADMIN_WHITELIST.includes(cleanAddress);

        if (existingEntry && !isWhitelisted) {
            // Handle legacy format (plain string) gracefully by assuming it was set right now
            const lastChangedAt = typeof existingEntry === 'string' ? now : existingEntry.lastChangedAt || 0;

            const daysSinceLastChange = (now - lastChangedAt) / (1000 * 60 * 60 * 24);
            const cooldownDays = 90;

            if (daysSinceLastChange < cooldownDays && existingEntry.username !== cleanName && typeof existingEntry !== 'string') {
                const daysLeft = Math.ceil(cooldownDays - daysSinceLastChange);
                throw new Error(`COOLDOWN_ACTIVE:${daysLeft}`);
            }
        }

        usersCache[cleanAddress] = {
            username: cleanName,
            lastChangedAt: now
        };

        saveUsers();

        return cleanName;
    }
}
