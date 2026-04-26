// this is the brain of the entire system
// It takes a request, and runs the sliding window algorithm
// and returns a result  allowed or blocked

import redis from "../redis/client"
import { getSlidingWindowScriptSHA } from "../redis/luaScripts"
import { getPlanConfig, getRouteConfig, SERVER_CONFIG } from "../config/index"
import { RateLimitRequest, RateLimitResult } from "../types/index"
import logger from "../logger/index"

export async function checkRateLimit(
    request: RateLimitRequest
): Promise<RateLimitResult> {

    // Figure out which limit applies 
    // Route specific config takes priority over plan config
    // like /login has its own strict limit regardless of plan

    const routeConfig = getRouteConfig(request.route)
    const planConfig = getPlanConfig(request.plan)

    // if a route config exists, use it otherwise fallback to plan config
    const limit = routeConfig ? routeConfig.limit: planConfig.limit
    const windowSecs = routeConfig ? routeConfig.windowSecs : planConfig.windowSecs

// Build the Redis Key
// key format --> ratelimit: userId:ip:route
// Each user + IP + route combination gets its own ZSET in Redis
const redisKey = `ratelimit:${request.userId}:${request.ip}:${request.route}`

// current time in milliseconds used as the score in ZSET
const nowMs = Date.now()

// window size in milliseconds
const windowMs = windowSecs * 1000


try {
    // Run the lua script atomically
    // EVALSHA runsd our pre-loaded script by its SHA hash
    // 1 = number of keys we're passing
    // rest are KEYS and ARGV that the Lua SCRIPT receives

    const sha = getSlidingWindowScriptSHA()

    const result = await redis.evalsha(
        sha,  // the SHA of our Lua script
        1,       // number of keys
        redisKey,   // keys[1] in Lua
        nowMs,      // ARGV[1] ion Lua - current timestamp
        windowMs,      // ARGV [2] in Lua - Window size
        limit          // ARGV[3] in Lua - Request Limit
    ) as [number, number]

    // result is an array [allowed, remaining]
    // allowed - 1 = yes, 0 = no
    // remaining - how many requests left

    const allowed = result[0] === 1
    const remaining = result[1]

    // Calculate when their window resets
    // we tell the client "try again after X seconds"
    const resetAfter = windowSecs

    //  Log the outcome
    logger.info({
        userId: request.userId,
        route: request.route,
        plan: request.plan,
        allowed,
        remaining,
        limit
    }, allowed ? "Request allowed" : "Request blocked")

    //Return the Result
    return {
        allowed,
        limit,
        remaining: allowed ? remaining : 0,
        resetAfter,
        reason: allowed ? undefined: " Rate limit exceeded "
    }
} catch (err) {
    // If Redis failed apply failover strategy
    logger.error({ err, userId: request.userId }, "Redis error during rate limit check")

    if (SERVER_CONFIG.failoverMode === "open") {
        // fail open: Redis is down, let the request through
        // Availability > strict enforcement
    logger.warn("Failing open - Allowing request due to Redis unavailability")
    return {
        allowed: true,
        limit,
        remaining: -1,
        resetAfter: windowSecs,
        reason: "Rate limiter unavailable - faialing open"
    }

    } else {
        // fail-closed: Redis is down block the request
        // strict enforcement > availability

    logger.warn("Failing closed - blocking request due to Redis unavailablility") 
    return {
        allowed: false,
        limit,
        remaining: 0,
        resetAfter: windowSecs,
        reason: "Rate limiter unavailable - failing closed"
    }
    }
}
}