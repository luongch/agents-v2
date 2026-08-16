import { readFile, writeFile, listFiles, deleteFile } from "./file.ts";
import {runCommand} from "./shell.ts"

// All tools combined for the agent
export const tools = {
  readFile,
  writeFile,
  listFiles,
  deleteFile,
  runCommand
};

// Export individual tools for selective use in evals
export { readFile, writeFile, listFiles, deleteFile } from "./file.ts";
export {runCommand} from "./shell.ts"

// Tool sets for evals
export const fileTools = {
  readFile,
  writeFile,
  listFiles,
  deleteFile,
};

export const terminalTools = {
  runCommand
}