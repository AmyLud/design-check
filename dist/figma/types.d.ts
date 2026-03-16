export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    children?: FigmaNode[];
    absoluteBoundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    style?: {
        fontSize?: number;
        fontWeight?: number;
        lineHeightPx?: number;
        textAlignHorizontal?: string;
    };
    fills?: Array<{
        type: string;
        color?: {
            r: number;
            g: number;
            b: number;
            a: number;
        };
    }>;
    cornerRadius?: number;
    characters?: string;
    visible?: boolean;
    layoutMode?: string;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
}
export interface FigmaApiResponse {
    nodes: Record<string, {
        document: FigmaNode;
    }>;
}
//# sourceMappingURL=types.d.ts.map