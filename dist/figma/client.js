"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFigmaNode = fetchFigmaNode;
async function fetchFigmaNode(fileKey, nodeId) {
    const token = process.env.FIGMA_TOKEN;
    if (!token || token.trim() === '') {
        throw new Error('FIGMA_TOKEN environment variable is not set.\n' +
            'Set it in your shell or in a .env file:\n' +
            '  FIGMA_TOKEN=your-figma-personal-access-token\n\n' +
            'To get a token: Figma → Account Settings → Personal access tokens → Create new token');
    }
    const encodedNodeId = encodeURIComponent(nodeId);
    const apiUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodedNodeId}`;
    let response;
    try {
        response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-Figma-Token': token.trim(),
                'Content-Type': 'application/json'
            }
        });
    }
    catch (networkError) {
        throw new Error(`Network error fetching Figma API: ${networkError.message}\n` +
            'Check your internet connection.');
    }
    if (response.status === 403) {
        throw new Error('Figma API returned 403 Forbidden.\n' +
            'Your FIGMA_TOKEN may be invalid or expired.\n' +
            'Regenerate your token at: Figma → Account Settings → Personal access tokens');
    }
    if (response.status === 404) {
        throw new Error(`Figma API returned 404 Not Found for file key "${fileKey}".\n` +
            'Check that:\n' +
            '  - The file key in the URL is correct\n' +
            '  - You have access to this Figma file\n' +
            '  - The file has not been deleted');
    }
    if (!response.ok) {
        let errorBody = '';
        try {
            errorBody = await response.text();
        }
        catch {
            // ignore
        }
        throw new Error(`Figma API returned ${response.status} ${response.statusText}.\n` +
            (errorBody ? `Response: ${errorBody}` : ''));
    }
    let data;
    try {
        data = (await response.json());
    }
    catch {
        throw new Error('Failed to parse Figma API response as JSON.');
    }
    if (!data.nodes || Object.keys(data.nodes).length === 0) {
        throw new Error(`No nodes found in Figma API response for node ID "${nodeId}".\n` +
            'The node may have been deleted or the ID is incorrect.');
    }
    // The API returns nodes keyed by nodeId (may be formatted differently)
    // Try exact match first, then try the first available node
    const nodeEntry = data.nodes[nodeId] ?? Object.values(data.nodes)[0];
    if (!nodeEntry || !nodeEntry.document) {
        throw new Error(`Node "${nodeId}" not found in Figma API response.\n` +
            `Available node IDs: ${Object.keys(data.nodes).join(', ')}`);
    }
    return nodeEntry.document;
}
//# sourceMappingURL=client.js.map