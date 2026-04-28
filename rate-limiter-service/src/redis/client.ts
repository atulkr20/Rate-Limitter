// Here we will create and exports a single redis connection
// one connection, shared across the whole service

import Redis from "ioredis"
import { SERVER_CONFIG } from "../config/index"
import logger from "../logger/index"

// Creating the redis client using the URL from our config
const redis = new Redis(SERVER_CONFIG.redisUrl, {
// if redis connection drops try reconnecting
// retry strategy runs every time a reconnect attempt happens

retryStrategy: function(times: number) {

    const delay = Math.min(times * 500, 2000)
    return delay
},

// Stop trying to reconnect after 10 failed attempts
maxRetriesPerRequest: 3
})

// These are event Listeners they fire when something happens to the connection 

redis.on('connect', function() {
    logger.info('Redis connected successfully')
})

redis.on('error', function(err: Error) {
    logger.error({ err }, 'Redis connection error')
})

redis.on('close', function() {
    logger.warn('Redis connection closed')
})

export default redis