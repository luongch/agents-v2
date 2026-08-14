import fs from "node:fs/promises"; //the node: prefix indicates that it is from node directly
import nodePath from "node:path"; 
import {tool} from "ai"
import {z} from "zod";

export const readFile = tool({
    description: 'Read the full contents of a file at the given path, always use this to read a file', //what does this tool do and when would you use it?
    inputSchema: z.object({
        path: z.string().describe('The path to the file to read'),
    }),
    execute: async ({path}) => {
        try {
            const content = await fs.readFile(path, 'utf-8');
            return content;
        } catch (error) {
            return `There was an error reading the file, here is the native error from node.js ${error}`;
        }
    },

});

export const writeFile = tool({
    description: 'Write the given content to a file at the given path, creates the file if it doesn\'t exist, overwrite if it does.', //what does this tool do and when would you use it?
    inputSchema: z.object({
        path: z.string().describe('The path to the file to write'),
        content: z.string().describe('The content to write to the file'),
    }),
    execute: async ({path, content}) => {
        try {
            const dir = nodePath.dirname(path);
            await fs.mkdir(dir, { recursive: true }); //recursive true means that if the path includes directories that doesn't exist, create them as well

            await fs.writeFile(path, content, 'utf-8');
            return `Successfully wrote ${content.length} characters to ${path}`;
        } catch (error) {
            return `Was not able to write to that file at that path, here is the node.js error: ${error}`;
        }
    },
});

export const listFiles = tool({
    description: 'List all the files and directories in the specified directory path',
    inputSchema: z.object({
        directory: z
        .string()
        .describe("The directory path to list the contents of")
        .default(".") //this let's the agent know that if the user asks to list a directory but give a directory then the agent doesn't need to follow up and to use the default
    }),
    execute: async ({directory}) => {
        try {
            const entries = await fs.readdir(directory, {withFileTypes: true}) //withFileTypes is to help the LLM know the different between 2 similarily named files based on their file type
            const items = entries.map((entry) => {
                const type = entry.isDirectory() ? "[dir]" : "[file]"
                return `${type} ${entry.name}` 
            });

            return items.length > 0
            ? items.join("\n")
            : `Directory ${directory} is empty`

        }catch(error) {
            return `Could not list the contents in this directory, here is the node.js error: ${error}`
        }
    }
});

export const deleteFile = tool({
    description: 'Delete a file at a given path. Use with caution as this is very desctructive and cannot be recovered.',
    inputSchema: z.object({
        path: z.string().describe('The path to the file you want to delete')
    }),
    execute: async ({path}) => {
        try {
            await fs.unlink(path)
            return `Successfully deleted file the file at ${path}`
        }catch(error) {
            return `Could not delete the file, here is the node.js error: ${error}`
        }
    }
})