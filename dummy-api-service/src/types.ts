export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAfter: number
  reason?: string
}
