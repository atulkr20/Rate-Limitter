// We load the Lua script into Redis once at startup
// Redis gives us back  a SHA hash  a fingerprint of the script 
// After that we call EVALSHA <sha> instead of sending the full script every time
// Faster and cleaner

import fs from "fs"
import path from "path"
import redis from "./client"
import logger from "../logger/index"

// this will hold the SHA after we load the script 
let slidingWindowScriptSHA: string = ""

export async function loadLuaScripts(): Promise<void> {
    // read the lua file from disk
    const scriptPath = path.join(__dirname, "../scripts/sliding_window.lua")
    const script = fs.readFileSync(scriptPath, "utf-8")

//SCRIPT LOAD sends the script to Redis and returns its SHA

slidingWindowScriptSHA = await redis.script ("LOAD", script) as string

logger.info({ sha: slidingWindowScriptSHA }, "Lua Script loaded into Redis")
}

// other files call this to get the SHA when they need to run the script

export function getSlidingWindowScriptSHA(): string {
    if (!slidingWindowScriptSHA) {
        throw new Error ("Lua script not loaded yet call loadLuaScripts() first")
    }

    return slidingWindowScriptSHA
}