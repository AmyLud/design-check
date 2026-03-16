import { DesignNode } from '../figma/normalize';
import { RenderedNode } from '../render/types';
export interface MatchResult {
    designNode: DesignNode;
    renderedNode: RenderedNode | null;
    confidence: number;
}
export declare function matchNodes(designNodes: DesignNode[], renderedNodes: RenderedNode[]): MatchResult[];
//# sourceMappingURL=match-text.d.ts.map