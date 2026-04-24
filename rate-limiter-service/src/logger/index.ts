// we have used pinoi here because it is a fast and structured JSON logger

import pino from 'pino'

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    // level = minimum severity to log
    // info means here log info, warn, erorr, skip debug
    
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true    // colored output in terminal
        }
    // transport means how logs are formatted
    // pino-pretty makes logs human readable in development
    
    }
})

export default logger