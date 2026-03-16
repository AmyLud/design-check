import { FigmaNode } from './types';
export interface DesignNode {
    id: string;
    name: string;
    type: 'FRAME' | 'TEXT' | 'RECTANGLE' | 'INSTANCE' | 'GROUP' | 'COMPONENT' | 'OTHER';
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    fontWeight?: number;
    lineHeight?: number;
    color?: string;
    borderRadius?: number;
    padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    children: DesignNode[];
}
export declare function normalizeFigmaNode(node: FigmaNode): DesignNode;
export declare function flattenNodes(node: DesignNode): DesignNode[];
export declare function getTextNodes(node: DesignNode): DesignNode[];
//# sourceMappingURL=normalize.d.ts.map