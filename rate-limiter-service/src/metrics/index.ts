// Simple in-memory counters that track what our rate limiter is doing.
// For now this gives us real numbers we can expose via an endpoint.

// Counter setup
// plain object to hold all our counters
// each key is a metric name, value is a number
const counters: Record<string, number> = {
  requests_total: 0,        // every request that came in
  requests_allowed: 0,      // requests we let through
  requests_blocked: 0,      // requests we blocked with 429
  redis_errors: 0,          // times Redis failed on us
  failover_open: 0,         // times we failed open
  failover_closed: 0        // times we failed closed
}

// Increment
// call this anywhere in the codebase to bump a counter
export function increment(metric: string): void {
  if (counters[metric] !== undefined) {
    counters[metric]++
  }
}


// Get all metrics
// returns a snapshot of all counters at this moment
export function getMetrics(): Record<string, number> {
  return { ...counters }   // spread to return a copy, not the original object
}

// reset

// useful for testing — reset all counters to zero
export function resetMetrics(): void {
  Object.keys(counters).forEach(function(key) {
    counters[key] = 0
  })
}