"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.loadConfig = loadConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.DEFAULT_CONFIG = {
    viewport: { width: 1440, height: 1024 },
    thresholds: {
        fontSizeDelta: 2,
        fontWeightTolerance: 100,
        borderRadiusDelta: 2,
        spacingDelta: 4,
        colorDelta: 10
    }
};
function deepMerge(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        const overrideValue = override[key];
        const baseValue = base[key];
        if (overrideValue !== null &&
            overrideValue !== undefined &&
            typeof overrideValue === 'object' &&
            !Array.isArray(overrideValue) &&
            typeof baseValue === 'object' &&
            baseValue !== null) {
            result[key] = deepMerge(baseValue, overrideValue);
        }
        else if (overrideValue !== undefined) {
            result[key] = overrideValue;
        }
    }
    return result;
}
async function loadConfig(configPath) {
    // Determine which config file to load
    const resolvedPath = configPath
        ? path_1.default.resolve(configPath)
        : path_1.default.resolve(process.cwd(), 'design-check.json');
    // If an explicit path was provided and doesn't exist, throw
    if (configPath && !fs_1.default.existsSync(resolvedPath)) {
        throw new Error(`Config file not found: "${resolvedPath}"`);
    }
    // If no explicit path and default doesn't exist, return defaults
    if (!configPath && !fs_1.default.existsSync(resolvedPath)) {
        return exports.DEFAULT_CONFIG;
    }
    let rawContent;
    try {
        rawContent = fs_1.default.readFileSync(resolvedPath, 'utf-8');
    }
    catch (err) {
        throw new Error(`Failed to read config file "${resolvedPath}": ${err.message}`);
    }
    let parsed;
    try {
        parsed = JSON.parse(rawContent);
    }
    catch (err) {
        throw new Error(`Failed to parse config file "${resolvedPath}" as JSON: ${err.message}`);
    }
    return deepMerge(exports.DEFAULT_CONFIG, parsed);
}
//# sourceMappingURL=config.js.map