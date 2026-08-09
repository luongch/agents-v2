import {evaluate} from "@lmnr-ai/lmnr";
import { multiTurnWithMocks } from "./executors";
import type { MultiTurnEvalData, MultiTurnTarget, MultiTurnResult, MultiTurnDatasetEntry } from "./types";
import {toolOrderCorrect, toolsAvoided, llmJudge} from "./evaluators";
import dataset from "./data/agent-multiturn.json" with { type: "json" };

const executor = async (data: MultiTurnEvalData) => {
    //why do we do this instead of just calling multiTurnWithMocks directly? 
    // In case we want to be able to manipulate the data before passing it into the executor
    return multiTurnWithMocks(data);
}

evaluate({
    data: dataset as any,
    executor,
    evaluators: {
        outputQuality: async (output: any, target: any) => {
            if(!target) return 1; // Skip if no target so we don't use the LLM judge because it is expensive
            return llmJudge(output, target);
        }
    },
    config: {
        projectApiKey: process.env.LMNR_API_KEY,
    },
    groupName: "agent-multiturn",
    
})