// Entry point of the service
// it loads Lua script first, then starts the HTTP server
// Here order matters
// if Lua script aren't loaded then the rate limitter won't work when first request arrives

import app from './app'
import { SERVER_CONFIG } from './config/index'
import { loadLuaScripts } from './redis/luaScripts'
import logger from "./logger/index"

async function startServer() {
    try {
        // 1. Load lua scripts into redis before accepting any traffic
        // This loads the sliding window script and stores its SHA
        await loadLuaScripts() 
        logger.info("Lua scripts loaded successfully")

        // 2. Start the HTTP server
    app.listen(SERVER_CONFIG.port, function() {
        logger.info(
            { port: SERVER_CONFIG.port},
            "Rate limiter service started"
        )
    })
    } catch (err) {
        // If something fails during startup, log and exit 
        // better to crash loudly than run silently broken
        logger.error({ err }, "Failed to start server")
        process.exit(1)
    }
}

//  Kick everything oiff

startServer()