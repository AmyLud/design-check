"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseViewport = parseViewport;
exports.ensureDir = ensureDir;
exports.saveJson = saveJson;
exports.rgbaToHex = rgbaToHex;
exports.generateId = generateId;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Parse a viewport string like "1440x1024" into width and height numbers.
 */
function parseViewport(viewportStr) {
    const match = viewportStr.trim().match(/^(\d+)[xX](\d+)$/);
    if (!match) {
        throw new Error(`Invalid viewport format: "${viewportStr}"\n` +
            'Expected format: WIDTHxHEIGHT (e.g., 1440x1024 or 375x812)');
    }
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    if (width < 1 || height < 1) {
        throw new Error(`Viewport dimensions must be positive: ${width}x${height}`);
    }
    return { width, height };
}
/**
 * Ensure a directory exists, creating it recursively if needed.
 */
function ensureDir(dir) {
    const resolved = path_1.default.resolve(dir);
    if (!fs_1.default.existsSync(resolved)) {
        fs_1.default.mkdirSync(resolved, { recursive: true });
    }
}
/**
 * Save data as pretty-printed JSON to a file.
 */
function saveJson(filePath, data) {
    const resolved = path_1.default.resolve(filePath);
    ensureDir(path_1.default.dirname(resolved));
    fs_1.default.writeFileSync(resolved, JSON.stringify(data, null, 2), 'utf-8');
}
/**
 * Convert RGBA values (r, g, b in 0-255 range, a in 0-1) to a hex color string.
 * If alpha < 1, appends the alpha byte (e.g., #rrggbbaa).
 */
function rgbaToHex(r, g, b, a) {
    const toHex = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (a < 1) {
        const alphaHex = toHex(Math.round(a * 255));
        return `${hex}${alphaHex}`;
    }
    return hex;
}
/**
 * Generate a short unique ID for findings.
 */
function generateId() {
    return crypto_1.default.randomBytes(4).toString('hex');
}
//# sourceMappingURL=utils.js.map