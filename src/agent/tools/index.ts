// import { getDateTime } from "./dateTime.ts";
import { readFile, writeFile, listFiles, deleteFile } from "./file.ts";
import { webSearch } from "./webSearch.ts";

// All tools combined for the agent
export const tools = {
  // getDateTime,
  readFile,
  writeFile,
  listFiles,
  deleteFile,
  webSearch
};

export {webSearch} from "./webSearch.ts";
export {readFile,writeFile,listFiles,deleteFile}  from "./file.ts" //example of how you can import individually
export const fileTools = { //example of if you want to group it so it's only file tools, 
  readFile,
  writeFile,
  listFiles,
  deleteFile
}