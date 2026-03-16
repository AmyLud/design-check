/**
 * Parse a viewport string like "1440x1024" into width and height numbers.
 */
export declare function parseViewport(viewportStr: string): {
    width: number;
    height: number;
};
/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export declare function ensureDir(dir: string): void;
/**
 * Save data as pretty-printed JSON to a file.
 */
export declare function saveJson(filePath: string, data: unknown): void;
/**
 * Convert RGBA values (r, g, b in 0-255 range, a in 0-1) to a hex color string.
 * If alpha < 1, appends the alpha byte (e.g., #rrggbbaa).
 */
export declare function rgbaToHex(r: number, g: number, b: number, a: number): string;
/**
 * Generate a short unique ID for findings.
 */
export declare function generateId(): string;
//# sourceMappingURL=utils.d.ts.map