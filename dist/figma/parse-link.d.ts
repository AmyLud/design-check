/**
 * Parses a Figma frame URL and extracts the fileKey and nodeId.
 *
 * Supported URL formats:
 *   https://www.figma.com/design/FILE_KEY/Name?node-id=12%3A45
 *   https://www.figma.com/file/FILE_KEY/Name?node-id=12:45
 */
export declare function parseFigmaLink(link: string): {
    fileKey: string;
    nodeId: string;
};
export declare function validateFigmaLink(link: string): boolean;
//# sourceMappingURL=parse-link.d.ts.map