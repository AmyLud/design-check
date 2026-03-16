"use strict";
/**
 * Parses a Figma frame URL and extracts the fileKey and nodeId.
 *
 * Supported URL formats:
 *   https://www.figma.com/design/FILE_KEY/Name?node-id=12%3A45
 *   https://www.figma.com/file/FILE_KEY/Name?node-id=12:45
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFigmaLink = parseFigmaLink;
exports.validateFigmaLink = validateFigmaLink;
function parseFigmaLink(link) {
    if (!validateFigmaLink(link)) {
        throw new Error(`Invalid Figma link: "${link}"\n` +
            'Expected format: https://www.figma.com/design/FILE_KEY/... or https://www.figma.com/file/FILE_KEY/...\n' +
            'Make sure the URL includes a node-id query parameter.');
    }
    let url;
    try {
        url = new URL(link);
    }
    catch {
        throw new Error(`Cannot parse URL: "${link}"`);
    }
    // Extract fileKey from path segments: /design/FILE_KEY/ or /file/FILE_KEY/
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const designOrFileIndex = pathSegments.findIndex((seg) => seg === 'design' || seg === 'file');
    if (designOrFileIndex === -1 || designOrFileIndex + 1 >= pathSegments.length) {
        throw new Error(`Could not extract file key from Figma URL path: "${url.pathname}"\n` +
            'Expected path like /design/FILE_KEY/ or /file/FILE_KEY/');
    }
    const fileKey = pathSegments[designOrFileIndex + 1];
    if (!fileKey || fileKey.trim() === '') {
        throw new Error(`Extracted empty file key from URL: "${link}"`);
    }
    // Extract nodeId from node-id query param (handles URL-encoded colons like 12%3A45 → 12:45)
    const rawNodeId = url.searchParams.get('node-id');
    if (!rawNodeId) {
        throw new Error(`Missing node-id query parameter in Figma URL: "${link}"\n` +
            'Select a specific frame in Figma and copy the link — it should include ?node-id=...');
    }
    // URL decode the node ID (e.g. "12%3A45" → "12:45")
    const nodeId = decodeURIComponent(rawNodeId);
    if (!nodeId || nodeId.trim() === '') {
        throw new Error(`Extracted empty node ID from URL: "${link}"`);
    }
    return { fileKey, nodeId };
}
function validateFigmaLink(link) {
    if (!link || typeof link !== 'string')
        return false;
    let url;
    try {
        url = new URL(link);
    }
    catch {
        return false;
    }
    // Must be a figma.com URL
    if (!url.hostname.includes('figma.com'))
        return false;
    // Path must contain /design/ or /file/
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const hasSupportedSegment = pathSegments.some((seg) => seg === 'design' || seg === 'file');
    if (!hasSupportedSegment)
        return false;
    // Must have a node-id query param
    if (!url.searchParams.has('node-id'))
        return false;
    return true;
}
//# sourceMappingURL=parse-link.js.map