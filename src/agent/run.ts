import { streamText, type ModelMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { getTracer } from "@lmnr-ai/lmnr";
import { tools } from "./tools/index.ts";
import { executeTool } from "./executeTool.ts";
import { SYSTEM_PROMPT } from "./system/prompt.ts";
import { Laminar } from "@lmnr-ai/lmnr";
import type { AgentCallbacks, ToolCallInfo } from "../types.ts";

import { filterCompatibleMessages } from "./system/filterMessages.ts";

Laminar.initialize({
  projectApiKey: process.env.LMNR_API_KEY,
});

const MODEL_NAME = "gpt-5-mini";

export async function runAgent(
  userMessage: string,
  conversationHistory: ModelMessage[],
  callbacks: AgentCallbacks,
): Promise<ModelMessage[]> {
  const workingHistory = filterCompatibleMessages(conversationHistory);
  const messages: ModelMessage[] = [
    {
      role: "system", // Add the system prompt to the beginning of the conversation
      content: SYSTEM_PROMPT,
    },
    ...workingHistory, // Add the filtered conversation history
    {
      role: "user", // Add the user's new message to the conversation
      content: userMessage,
    },
  ];

  let fullResponse = "";

  while (true) {
    const result = streamText({
      model: openai(MODEL_NAME),
      messages,
      tools,
      experimental_telemetry: {
        isEnabled: true,
        tracer: getTracer(),
      }
    });

    const toolCalls:ToolCallInfo[] = [];
    let currentText = "";
    let streamError: Error | null = null;

    try { //if something breaks we want to catch it
      for await (const chunk of result.fullStream) { //as a new chunk from the fullStream is received, we will process it (hey the LLM is saying something let's capture it)
        if(chunk.type === "text-delta") { //text-delta means a new token came in
          currentText += chunk.text;
          callbacks.onToken(chunk.text); //this allows the ui to stream the token in the terminal of the terminal made for this course
        }
        if(chunk.type === "tool-call") { //hey there was a tool call
          const input = 'input' in chunk ? chunk.input : {};
          toolCalls.push({
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            args: input as any,
          })
          callbacks.onToolCallStart(chunk.toolName, input); 
        }
      }    
    }
    catch (e) {
      streamError = e as Error;

      if (!currentText && !streamError.message.includes("No output generated")) {
        throw streamError;
      }    
    }

    fullResponse += currentText;

    if(streamError && !currentText) {
      fullResponse = 'Sorry something is wrong with the agent, please try again later';
      callbacks.onToken(fullResponse);
      break;
    }      

    //collect finish reason, finish reason can be "I am done with my response" or "I need to call a tool"
    const finishReason = await result.finishReason;
    if(finishReason !== "tool-calls" && toolCalls.length === 0) {
      //ready to respond
      const responseMessage = await result.response;
      messages.push(...responseMessage.messages) //if we don't do this the user won't be able to reply to it
      break;
    }

    //if we get to this step then there was no errors and we have tool calls to process
    const responseMessage = await result.response;
    messages.push(...responseMessage.messages);
    
    //execute the tool calls
    for (const tc of toolCalls) {
      const result = await executeTool(tc.toolName, tc.args);

      callbacks.onToolCallEnd(tc.toolName, result); //if you had a UI and you wanted to show the results of the tool, this is what this is for
      
      messages.push({
        role: "tool",
        content: [
          {
          type: 'tool-result',
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          output: {type: 'text', value: "result"}
          }          
        ]
      })
    }
  }

  callbacks.onComplete(fullResponse);
  return messages;
}
