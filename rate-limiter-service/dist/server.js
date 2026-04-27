"use strict";
// Entry point of the service
// it loads Lua script first, then starts the HTTP server
// Here order matters
// if Lua script aren't loaded then the rate limitter won't work when first request arrives
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const index_1 = require("./config/index");
const luaScripts_1 = require("./redis/luaScripts");
const index_2 = __importDefault(require("./logger/index"));
async function startServer() {
    try {
        // 1. Load lua scripts into redis before accepting any traffic
        // This loads the sliding window script and stores its SHA
        await (0, luaScripts_1.loadLuaScripts)();
        index_2.default.info("Lua scripts loaded successfully");
        // 2. Start the HTTP server
        app_1.default.listen(index_1.SERVER_CONFIG.port, function () {
            index_2.default.info({ port: index_1.SERVER_CONFIG.port }, "Rate limiter service started");
        });
    }
    catch (err) {
        // If something fails during startup, log and exit 
        // better to crash loudly than run silently broken
        index_2.default.error({ err }, "Failed to start server");
        process.exit(1);
    }
}
//  Kick everything oiff
startServer();
