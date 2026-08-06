import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import type {
  EvalTarget,
  SingleTurnResult,
  MultiTurnTarget,
  MultiTurnResult,
} from "./types.ts";

/**
 * Evaluator: Precision/recall score for tool selection.
 * Returns a score between 0 and 1 based on correct selections.
 * For secondary prompts.
 */
export function toolSelectionScore(
  output: SingleTurnResult,
  target: EvalTarget,
): number {
  if (!target.expectedTools?.length) {
    return output.selectedAny ? 0.5 : 1;
  }

  const expected = new Set(target.expectedTools);
  const selected = new Set(output.toolNames);

  console.log(output)
  
  const hits = output.toolNames.filter((t) => expected.has(t)).length;
  const precision = selected.size > 0 ? hits / selected.size : 0;
  const recall = expected.size > 0 ? hits / expected.size : 0;

  // Simple F1-ish score
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

// export function toolsSelected(
//   output: SingleTurnResult | MultiTurnResult,
//   target: EvalTarget | MultiTurnTarget,
// ): number {
//   const expectedTools =
//     "expectedTools" in target
//       ? target.expectedTools
//       : "expectedToolOrder" in target
//         ? target.expectedToolOrder
//         : undefined;

//   if (!expectedTools?.length) return 1;

//   const selected = new Set(
//     "toolNames" in output ? output.toolNames : output.toolsUsed,
//   );

//   return expectedTools.every((t) => selected.has(t)) ? 1 : 0;
// }
