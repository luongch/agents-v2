import "dotenv/config";
import {generateText, type ModelMessage} from "ai";
import {openai} from "@ai-sdk/openai";
import { SYSTEM_PROMPT} from "./system/prompt";
import type { AgentCallbacks } from "../types.ts";
import { tools } from "./tools/index.ts";
import { executeTool } from "./executeTools.ts";
const MODEL_NAME = "gpt-5-mini";

export const runAgent = async(
    userMessage: string,
    conversationHistory: ModelMessage[],
    callbacks: AgentCallbacks,
) => {
    const {text, toolCalls} = await generateText({
        model: openai(MODEL_NAME),
        prompt: userMessage,
        systems: SYSTEM_PROMPT,
        tools
    });

    console.log(text, toolCalls);

    //lesson 2 testing purposes
    toolCalls.forEach(async (tc)=>{
        console.log(await executeTool(tc.toolName, tc.input))
    })
};

runAgent("what is the current time?");

//npx tsx src\agent\run.ts