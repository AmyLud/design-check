import { RenderedNode } from './types';
export interface CaptureOptions {
    url: string;
    viewport: {
        width: number;
        height: number;
    };
    outputDir: string;
    verbose?: boolean;
}
export interface CaptureResult {
    screenshotPath: string;
    nodes: RenderedNode[];
}
export declare function capturePage(options: CaptureOptions): Promise<CaptureResult>;
//# sourceMappingURL=capture-page.d.ts.map