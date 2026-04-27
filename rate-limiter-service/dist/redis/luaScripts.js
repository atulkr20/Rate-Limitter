"use strict";
// We load the Lua script into Redis once at startup
// Redis gives us back  a SHA hash  a fingerprint of the script 
// After that we call EVALSHA <sha> instead of sending the full script every time
// Faster and cleaner
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadLuaScripts = loadLuaScripts;
exports.getSlidingWindowScriptSHA = getSlidingWindowScriptSHA;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = __importDefault(require("./client"));
const index_1 = __importDefault(require("../logger/index"));
// this will hold the SHA after we load the script 
let slidingWindowScriptSHA = "";
async function loadLuaScripts() {
    // read the lua file from disk
    const scriptPath = path_1.default.join(__dirname, "../scripts/sliding_window.lua");
    const script = fs_1.default.readFileSync(scriptPath, "utf-8");
    //SCRIPT LOAD sends the script to Redis and returns its SHA
    slidingWindowScriptSHA = await client_1.default.script("LOAD", script);
    index_1.default.info({ sha: slidingWindowScriptSHA }, "Lua Script loaded into Redis");
}
// other files call this to get the SHA when they need to run the script
function getSlidingWindowScriptSHA() {
    if (!slidingWindowScriptSHA) {
        throw new Error("Lua script not loaded yet call loadLuaScripts() first");
    }
    return slidingWindowScriptSHA;
}
