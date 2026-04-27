"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTE_CONFIGS = exports.PLAN_CONFIGS = exports.SERVER_CONFIG = void 0;
exports.getPlanConfig = getPlanConfig;
exports.getRouteConfig = getRouteConfig;
const index_1 = require("../types/index");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Server config
exports.SERVER_CONFIG = {
    port: process.env.PORT || 3001,
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    // Fail-open = allow requests when Redis is down
    // Fail-closed: block requests when Redis is down
    failoverMode: process.env.FAILOVER_MODE || "open"
};
// Plan based Limits
// Default limits per plan applies to all routes
// Unless a route-specific limit overrides it 
exports.PLAN_CONFIGS = [
    {
        plan: index_1.Plan.FREE,
        limit: 100, // 100 requests per window 
        windowSecs: 900 // 15 minutes
    },
    {
        plan: index_1.Plan.PRO,
        limit: 1000,
        windowSecs: 900
    },
    {
        plan: index_1.Plan.ENTERPRISE,
        limit: 10000,
        windowSecs: 900
    }
];
// Rote specific limits
// These limits are for sensitive routes
// /login is stricter because brute force attacks happen her
// /posts is relaxed because it's just reading data
exports.ROUTE_CONFIGS = [
    {
        route: "/login",
        limit: 5,
        windowSecs: 60 // per 60 seconds 
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
];
// Helper Function
// Given a plan return its config
// Array.find() searches the arrya and return the first match
function getPlanConfig(plan) {
    const config = exports.PLAN_CONFIGS.find(function (c) {
        return c.plan === plan;
    });
    // if somehow an unknown plan is passed fall back to FREE limits
    // this is a safety net should never happen if types are used correctly
    if (!config) {
        return exports.PLAN_CONFIGS[0];
    }
    return config;
}
// Given a route, return its specific config if it exists
// Returns null if no special config then caller will use  config instead
function getRouteConfig(route) {
    const config = exports.ROUTE_CONFIGS.find(function (c) {
        return c.route === route;
    });
    return config || null;
}
