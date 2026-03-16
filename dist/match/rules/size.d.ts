import { MatchResult } from '../match-text';
import { Finding } from '../../shared/findings';
import { ThresholdConfig } from '../../shared/config';
/**
 * Check that element dimensions in the rendered page match the Figma design.
 * Returns warning findings where width or height differs beyond the configured deltas.
 */
export declare function checkSize(matches: MatchResult[], thresholds: ThresholdConfig): Finding[];
//# sourceMappingURL=size.d.ts.map