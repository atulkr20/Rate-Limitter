import { Plan, PlanConfig, RouteConfig } from '../types/index'

import dotenv from 'dotenv'
dotenv.config()

// Server config

export const SERVER_CONFIG = {
    port: process.env.PORT || 3001,
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

    // Fail-open = allow requests when Redis is down
    // Fail-closed: block requests when Redis is down

    failoverMode: process.env.FAILOVER_MODE || "open"
}

// Plan based Limits

// Default limits per plan applies to all routes
// Unless a route-specific limit overrides it 

export const PLAN_CONFIGS: PlanConfig[] = [
    {
        plan: Plan.FREE,
        limit: 100,       // 100 requests per window 
        windowSecs: 900     // 15 minutes
    },

    {
        plan: Plan.PRO,
        limit: 1000,
        windowSecs: 900
    },
    {
        plan: Plan.ENTERPRISE,
        limit: 10000,
        windowSecs: 900
    }
]


// Rote specific limits

// These limits are for sensitive routes
// /login is stricter because brute force attacks happen her
// /posts is relaxed because it's just reading data

export const ROUTE_CONFIGS: RouteConfig[] = [
    {
        route: "/login",
        limit: 5,
        windowSecs: 60    // per 60 seconds 
    },
    {
        route: "/posts",
        limit: 200,
        windowSecs: 60
    },
    {
        route: "/profile",
        limit: 50,
        windowSecs: 60
    }
]

// Helper Function
// Given a plan return its config
// Array.find() searches the arrya and return the first match
export function getPlanConfig(plan: Plan): PlanConfig {
    const config = PLAN_CONFIGS.find(function(c) {
        return c.plan === plan
    })

    // if somehow an unknown plan is passed fall back to FREE limits
    // this is a safety net should never happen if types are used correctly

if (!config) {
    return PLAN_CONFIGS[0]
}

return config 
}

// Given a route, return its specific config if it exists
// Returns null if no special config then caller will use  config instead

export function getRouteConfig(route: string): RouteConfig | null {
    const config = ROUTE_CONFIGS.find(function(c) {
        return c.route === route
    })

    return config || null
}