//  This file  creates the Express app and registers middleware and routes
// We keep this  separate from server.ts  to the app can be tested independently without actually starting a server

import express from 'express'
import { rateLimiterMiddleware } from './middleware/rateLimiter'
import checkRouter from './routes/check'

const app = express()

app.use(express.json())


// health check endpoint 
app.get('/health', function(req, res) {
    res.status(200).json({
        status: "ok",
        service: "rate-limiter-service"
    })
})

// /check microservice endpoint 
// no rate limittig on this route this itself is the rate limitter

app.use("/", checkRouter)

// any route registered after this will be rate limited

export default app