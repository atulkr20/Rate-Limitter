"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const pino_1 = __importDefault(require("pino"));
dotenv_1.default.config();
const loggerOptions = {};
if (process.env.NODE_ENV !== "production") {
    loggerOptions.transport = {
        target: "pino-pretty",
        options: {
            colorize: true,
        },
    };
}
const logger = (0, pino_1.default)(loggerOptions);
const PORT = process.env.PORT || 3002;
app_1.default.listen(PORT, function () {
    logger.info({ port: PORT }, "Dummy API");
});
