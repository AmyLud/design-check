export interface RenderedNode {
    selector: string;
    tag: string;
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: string;
    padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    role?: string;
}
//# sourceMappingURL=types.d.ts.map