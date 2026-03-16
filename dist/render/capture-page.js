"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capturePage = capturePage;
const path_1 = __importDefault(require("path"));
const playwright_1 = require("playwright");
const extract_dom_1 = require("./extract-dom");
const utils_1 = require("../shared/utils");
async function capturePage(options) {
    const { url, viewport, outputDir, verbose } = options;
    (0, utils_1.ensureDir)(outputDir);
    if (verbose) {
        console.log(`  Launching Chromium browser...`);
        console.log(`  Navigating to: ${url}`);
        console.log(`  Viewport: ${viewport.width}x${viewport.height}`);
    }
    const browser = await playwright_1.chromium.launch({
        headless: true
    });
    try {
        const context = await browser.newContext({
            viewport: {
                width: viewport.width,
                height: viewport.height
            },
            // Disable animations for consistent screenshots
            reducedMotion: 'reduce'
        });
        const page = await context.newPage();
        // Navigate and wait for network to be idle
        try {
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
        }
        catch (navError) {
            // If networkidle times out, try with domcontentloaded instead
            if (verbose) {
                console.log(`  Network idle timed out, falling back to domcontentloaded...`);
            }
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            // Give JS a moment to run
            await page.waitForTimeout(2000);
        }
        // Take screenshot
        const screenshotPath = path_1.default.join(outputDir, 'screenshot.png');
        await page.screenshot({
            path: screenshotPath,
            fullPage: false
        });
        if (verbose) {
            console.log(`  Screenshot saved to: ${screenshotPath}`);
        }
        // Extract DOM nodes
        const script = (0, extract_dom_1.extractDomScript)();
        let nodes = [];
        try {
            const rawNodes = await page.evaluate(script);
            nodes = rawNodes ?? [];
            if (verbose) {
                console.log(`  Extracted ${nodes.length} DOM nodes`);
            }
        }
        catch (evalError) {
            console.warn(`  Warning: DOM extraction failed: ${evalError.message}`);
            nodes = [];
        }
        await context.close();
        return { screenshotPath, nodes };
    }
    finally {
        await browser.close();
    }
}
//# sourceMappingURL=capture-page.js.map