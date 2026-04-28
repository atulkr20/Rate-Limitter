// It tests the Lua script against a real redis instance
// we are using real redis because we  want to confirm the actual script behaviour

import fs from 'fs'
import path from 'path'
import Redis from 'ioredis'

// Setup
const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
})

let scriptSHA: string
// Load the Lua script once before all tests
beforeAll(async () => {
    const scriptPath = path.join(__dirname, "../scripts/sliding_window.lua")
    const script = fs.readFileSync(scriptPath, "utf-8")
    scriptSHA = await redis.script("LOAD", script) as string
})

// Clean state before every test so tests don't bleed into each other
beforeEach(async () => {
    await redis.flushdb()
})

afterAll(async () => {
    await redis.quit()
})

// Helper
// Call EVALSHA with the same arguement shape as your actual service will use
async function callScript(
    key: string,
    now: number,
    windowMs: number,
    limit: number
): Promise<[number, number]> {
    const result = await redis.evalsha(
        scriptSHA,
        1,
        key,
        now,
        windowMs,
        limit
    ) as [number, number]

    return result
}

// Tests 
describe("sliding_window Lua script", () => {
    const KEY = "test:user1:/api/data"
    const WINDOW_MS = 60_000 //  1 minute
    const LIMIT = 5
    const NOW = Date.now()

    // 1. Happy path

    it("should allow requests when under the limit", async () => {
        const [allowed, remaining] = await callScript(KEY, NOW, WINDOW_MS, LIMIT)
        // first request should go through
        expect(allowed).toBe(1)
        // 5 limit, 1 used -> 4 remaining
        expect(remaining).toBe(4)

    })

    // 2. Boundary
    it("should block the request exactly at the limit", async () => {
        // fire LIMIT requests to fill up the window
        for (let i = 0; i < LIMIT; i++) {
            // offset timestamps slightly so ZADD members are unique
            await callScript(KEY, NOW + i, WINDOW_MS, LIMIT)
        }
 
        // this (LIMIT + 1)th request should be blocked
        const [allowed, remaining] = await callScript(KEY, NOW + LIMIT, WINDOW_MS, LIMIT)
 
        expect(allowed).toBe(0)
        expect(remaining).toBe(0)
    })

    // Window expiry
     it("should allow requests again after the window has passed", async () => {
        // fill up the window at time T
        for (let i = 0; i < LIMIT; i++) {
            await callScript(KEY, NOW + i, WINDOW_MS, LIMIT)
        }
 
        // confirm it's blocked at T + LIMIT (still inside the window)
        const [blockedAllowed] = await callScript(KEY, NOW + LIMIT, WINDOW_MS, LIMIT)
        expect(blockedAllowed).toBe(0)
 
        // now simulate a request coming in AFTER the window has fully elapsed
        // NOW + WINDOW_MS + 1 means all the old entries fall outside the window
        const futureNow = NOW + WINDOW_MS + LIMIT
        const [allowed, remaining] = await callScript(KEY, futureNow, WINDOW_MS, LIMIT)
 
        // should be allowed again — old timestamps were cleaned by ZREMRANGEBYSCORE
        expect(allowed).toBe(1)
        expect(remaining).toBe(LIMIT - 1)
    })

    // Key isolation
    it("should not let two different client+route combos affect each other", async () => {
        const KEY_A = "test:userA:/api/orders"
        const KEY_B = "test:userB:/api/orders"
 
        // max out KEY_A
        for (let i = 0; i < LIMIT; i++) {
            await callScript(KEY_A, NOW + i, WINDOW_MS, LIMIT)
        }
 
        // KEY_A is blocked
        const [blockedA] = await callScript(KEY_A, NOW + LIMIT, WINDOW_MS, LIMIT)
        expect(blockedA).toBe(0)
 
        // KEY_B should still be wide open — completely separate ZSET
        const [allowedB, remainingB] = await callScript(KEY_B, NOW, WINDOW_MS, LIMIT)
        expect(allowedB).toBe(1)
        expect(remainingB).toBe(LIMIT - 1)
    })
})