import { generateText, stepCountIs, tool, type ToolSet} from "ai"
import {openai} from "@ai-sdk/openai"
import {z} from "zod"

import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from "./types.ts";
import { buildMessages } from "./utils.ts";

const TOOL_DEFINITIONS: any ={
  readFile: {
    description: "Read the contents of a file at the specified path",
    parameters: z.object({
      path: z.string().describe("the path to the file you want to read")
    })
  },
  writeFile: {
    description: "Write given content to the file at a specified path",
    parameters: z.object({
      path: z.string().describe("the path of the file you want to write to"),
      content: z.string().describe("the content you want to write")
    })
  },
  listFiles: {
    description: "List all the files in a directory",
    parameters: z.object({
      path: z.string().describe("the path of the directory you want a list of files for")
    })
  },
  deleteFile: {
    description: "Delete the file at a specified path", //had to update remove to delete otherwise it doesn't know to delete
    parameters: z.object({
     path: z.string().describe("the path to the file you want to delete") 
    })
  },
  runCommand: {
    description: "Execute a shell command and return its output",
    parameters: z.object({
     command: z.string().describe("the shell command to execute") 
    })
  },
}

// this is what we use to run our evals(tests?)
// it looks at the eval data and creates a toolset
export const singleTurnExecutorWithMocks = async (data: EvalData) => {
  const messages = buildMessages(data);

  const tools: ToolSet = {};
  //the tools that we want to use for this eval are defined in the data.tools array
  for (const toolName of data.tools) {
    const definiition = TOOL_DEFINITIONS[toolName]

    if(definiition) {
      tools[toolName] = tool({
        description: definiition.description,
        inputSchema: definiition.parameters
      })
    }
  }  

  //run the agent with the messages and tools (this is a prompt?)
  const result = await generateText({
    model: openai(data.config?.model ?? "gpt-5-mini"),
    messages,
    tools,
    stopWhen: stepCountIs(1),
    temperature: data.config?.temperature ?? undefined,  
    providerOptions: { //this is needed to make the delete eval pass, otherwise it will fail because the model will not select the deleteFile tool
      openai: {
        reasoningEffort: "high",
      },
    },
  })

  //get the tool calls from the result  
  const toolCalls = (result.toolCalls ?? []).map((tc) => ({
    toolName: tc.toolName,
    args: "args" in tc ? tc.args : {},
  }));

  //get the tool names from the tool calls
  const toolNames = toolCalls.map((tc) => tc.toolName);

  
  return {
    toolCalls,
    toolNames,
    selectedAny: toolNames.length > 0 //if any tools selected then return true
  }
};

