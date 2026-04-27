"use strict";
// this is a express middleware layer
// It calls our rate limiter service and either lets the request through or blocks it with a 429 response
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiterMiddleware = rateLimiterMiddleware;
const rateLimiterService_1 = require("../services/rateLimiterService");
const index_1 = require("../types/index");
const index_2 = __importDefault(require("../logger/index"));
async function rateLimiterMiddleware(req, res, next) {
    // 1. Extract identity from the request
    // IN a real app userId would come from a decoded JWT token 
    // For now we read it from the request header
    const userId = req.headers["x-user-id"] || "anonymous";
    const plan = req.headers["x-user-plan"] || index_1.Plan.FREE;
    const ip = req.ip || "unknown";
    const route = req.path;
    // 2. Now build the rate limit request object 
    // This matches the Ratelimitrequest interface we defined in types/index.ts
    const rateLimitRequest = {
        userId,
        ip,
        route,
        plan
    };
    // Call the core service
    const result = await (0, rateLimiterService_1.checkRateLimit)(rateLimitRequest);
    // Set rate limit headers on the response
    // these headers tell the client exactly what their limit status is
    // x-Ratelimit-Limit = total allowed requests in the window
    // x-Ratelimit-Remaining = how many they have left
    // x-Rate-limit-Reset = seconds until their window resets
    res.setHeader("x-RateLimit-Limit", result.limit);
    res.setHeader("x-RateLimit-Remaining", result.remaining);
    res.setHeader("x-RateLimit-Reset", result.resetAfter);
    // Allow or block
    if (result.allowed) {
        next();
        return;
    }
    // if blocked send 429 too many requests
    // we also set Retry-after header which tells client when to try again
    res.setHeader("Retry-After", result.resetAfter);
    index_2.default.warn({
        userId,
        route,
        plan
    }, "Request blocked by Rate Limitter");
    res.status(429).json({
        success: false,
        mesage: "Too many requests",
        reason: result.reason,
        retryAfter: result.resetAfter
    });
}
