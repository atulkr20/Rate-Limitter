// this is a fake backend service with three routes 
// Before each resposne, it checks with our rate limiter microservice


import express from 'express'
import { checkLimit } from './rateLimitClient'

const app = express()
app.use(express.json())

// helper functiopn to extract identoty from the request headers
// Same headers the rate limiter middleware uses 

function getIdentity(req: express.Request) {
    return {
        userId: req.headers["x-user-id"] as string || "anonymous",
        plan: req.headers['x-user-plan'] as string || "free",
        ip:  req.ip  || "unknown"
    }
}

// /login - strictest rate limit (5 per 60s)
app.post("/login", async function (req, res) {
    const { userId, plan, ip } = getIdentity(req)

    const result = await checkLimit(userId, ip, "/login", plan)

    // Set the headers so the client can see their limit status
    res.setHeader("X-RateLimit-Limit", result.limit)
    res.setHeader("x-RateLimit-Remaining", result.remaining)
    res.setHeader("x-RateLimit-Reset", result.resetAfter)

    if(!result.allowed) {
        res.status(429).json({ success: false, message: "Too many login attempts"})
        return
    }
    res.status(200).json({ success: true, message: "Login Atempted"})
})

// /posts - relaxed limit(200 per 60s)
app.get("/posts", async function(req, res) {
    const { userId, plan, ip } = getIdentity(req)

    const result = await checkLimit(userId, ip, "/posts", plan)

     res.setHeader("X-RateLimit-Limit", result.limit)
  res.setHeader("X-RateLimit-Remaining", result.remaining)
  res.setHeader("X-RateLimit-Reset", result.resetAfter)

  if(!result.allowed) {
    res.status(429).json({ success: false, message: "Too many requests"})
    return
  }

  res.status(200).json({
    success: true,
    posts: [
        { id: 1, title: "Post one"},
        { id: 2, title: "Post two"}
    ]
  })
})

// /profile - medium limit (50 per 60s)
app.get("/profile", async function(req, res) {
    const { userId, plan, ip } = getIdentity(req)

    const result = await checkLimit(userId, ip, "/profile", plan)
res.setHeader("X-RateLimit-Limit", result.limit)
  res.setHeader("X-RateLimit-Remaining", result.remaining)
  res.setHeader("X-RateLimit-Reset", result.resetAfter)

  if(!result.allowed) {
    res.status(429).json({ success: false, message: " Too many requests"})
    return
  }

  res.status(200).json({
    success: true,
    profile: { userId, plan, name: "Atul"}
  })
})

export default app