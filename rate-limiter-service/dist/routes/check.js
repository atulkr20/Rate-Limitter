"use strict";
// this is the microservice endpoint
// Other backend services call POST /check to ask:  is this user allowed to make a request right now?
// This is what makes our rate limiter a standalone microservice
// instead of just a middleware inside one app
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimiterService_1 = require("../services/rateLimiterService");
const index_1 = require("../types/index");
const router = (0, express_1.Router)();
router.post("/check", async function (req, res) {
    // Read the body
    // The calling service sends userId, ip, route, plan
    const { userId, ip, route, plan } = req.body;
    const normalizedPlan = typeof plan === "string" ? plan.toUpperCase() : plan;
    // Basic Validation
    if (!userId || !ip || !route || !plan) {
        res.status(400).json({
            success: false,
            message: "Missing required fields: userId, ip, route, plan"
        });
        return;
    }
    // Validate Plan  value
    // plan must be one of our known plans
    const validPlans = Object.values(index_1.Plan);
    // Object.values(Plan) returns ["free", "Pro", "enterprise"]
    if (!validPlans.includes(normalizedPlan)) {
        res.status(400).json({
            success: false,
            message: `Invalid plan. Must be one of: ${validPlans.join(", ")}`
        });
        return;
    }
    // Build the request object and call the service
    const rateLimitRequest = {
        userId,
        ip,
        route,
        plan: normalizedPlan //  cast to plan enum we validated it above
    };
    const result = await (0, rateLimiterService_1.checkRateLimit)(rateLimitRequest);
    // Return the result
    // The calling services usees this to decide whether to proceed
    res.status(result.allowed ? 200 : 429).json({
        success: result.allowed,
        allowed: result.allowed,
        limit: result.limit,
        remaining: result.remaining,
        resetAfter: result.resetAfter,
        reason: result.reason || null
    });
});
exports.default = router;
