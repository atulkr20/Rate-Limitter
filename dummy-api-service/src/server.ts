import app from "./app"
import dotenv from "dotenv"
import pino from "pino"

dotenv.config()

const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
        },
    },
})
const PORT = process.env.PORT || 3002

app.listen(PORT, function() {
    logger.info({ port: PORT }, "Dummy API")
})