"use strict";
// we have used pinoi here because it is a fast and structured JSON logger
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || "info",
    // level = minimum severity to log
    // info means here log info, warn, erorr, skip debug
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true // colored output in terminal
        }
        // transport means how logs are formatted
        // pino-pretty makes logs human readable in development
    }
});
exports.default = logger;
