"use strict";
// Simple in-memory counters that track what our rate limiter is doing.
// For now this gives us real numbers we can expose via an endpoint.
Object.defineProperty(exports, "__esModule", { value: true });
exports.increment = increment;
exports.getMetrics = getMetrics;
exports.resetMetrics = resetMetrics;
// Counter setup
// plain object to hold all our counters
// each key is a metric name, value is a number
const counters = {
    requests_total: 0, // every request that came in
    requests_allowed: 0, // requests we let through
    requests_blocked: 0, // requests we blocked with 429
    redis_errors: 0, // times Redis failed on us
    failover_open: 0, // times we failed open
    failover_closed: 0 // times we failed closed
};
// Increment
// call this anywhere in the codebase to bump a counter
function increment(metric) {
    if (counters[metric] !== undefined) {
        counters[metric]++;
    }
}
// Get all metrics
// returns a snapshot of all counters at this moment
function getMetrics() {
    return { ...counters }; // spread to return a copy, not the original object
}
// reset
// useful for testing — reset all counters to zero
function resetMetrics() {
    Object.keys(counters).forEach(function (key) {
        counters[key] = 0;
    });
}
