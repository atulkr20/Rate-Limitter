export enum Plan {
    FREE = "FREE",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE"
}

export interface PlanConfig {
    plan: Plan
    limit: number
    windowSecs: number
}

export interface RouteConfig {
    route: string
    limit: number
    windowSecs: number
}

export interface RateLimitRequest {
    userId: string
    ip: string
    route: string
    plan: Plan
}

export interface RateLimitResult {
    allowed: boolean
    limit: number
    remaining: number
    resetAfter: number
    reason?: string
}