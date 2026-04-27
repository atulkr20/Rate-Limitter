// this is the microservice endpoint
// Other backend services call POST /check to ask:  is this user allowed to make a request right now?
// This is what makes our rate limiter a standalone microservice
// instead of just a middleware inside one app

import { Router, Request, Response } from 'express'
import { checkRateLimit } from '../services/rateLimiterService'
import { Plan, RateLimitRequest } from '../types/index'

const router = Router()

router.post("/check", async function(req: Request, res: Response) {
    // Read the body
    // The calling service sends userId, ip, route, plan
    const { userId, ip, route, plan } = req.body
    const normalizedPlan = typeof plan === "string" ? plan.toUpperCase() : plan

    // Basic Validation

    if(!userId || !ip || !route || !plan) {
        res.status(400).json({
            success: false,
            message: "Missing required fields: userId, ip, route, plan"
        })
        return
    }
    // Validate Plan  value
    // plan must be one of our known plans

    const validPlans = Object.values(Plan)

    // Object.values(Plan) returns ["free", "Pro", "enterprise"]

    if(!validPlans.includes(normalizedPlan)) {
        res.status(400).json({
            success: false,
            message: `Invalid plan. Must be one of: ${validPlans.join(", ")}`
        })
        return 
    }
    // Build the request object and call the service
    const rateLimitRequest: RateLimitRequest = {
        userId,
        ip,
        route,
        plan: normalizedPlan as Plan   //  cast to plan enum we validated it above
    }

    const result = await checkRateLimit(rateLimitRequest)

    // Return the result
    // The calling services usees this to decide whether to proceed
    res.status(result.allowed ? 200 : 429).json({
        success: result.allowed,
        allowed: result.allowed,
        limit: result.limit,
        remaining: result.remaining,
        resetAfter: result.resetAfter,
        reason: result.reason || null
    })

})
export default router