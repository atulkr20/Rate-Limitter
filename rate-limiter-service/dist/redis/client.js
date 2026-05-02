"use strict";
// Here we will create and exports a single redis connection
// one connection, shared across the whole service
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const index_1 = require("../config/index");
const index_2 = __importDefault(require("../logger/index"));
// Creating the redis client using the URL from our config
const redis = new ioredis_1.default(index_1.SERVER_CONFIG.redisUrl, {
    // if redis connection drops try reconnecting
    // retry strategy runs every time a reconnect attempt happens
    retryStrategy: function (times) {
        const delay = Math.min(times * 500, 2000);
        return delay;
    },
    // Stop trying to reconnect after 10 failed attempts
    maxRetriesPerRequest: 3
});
// These are event Listeners they fire when something happens to the connection 
redis.on('connect', function () {
    index_2.default.info('Redis connected successfully');
});
redis.on('error', function (err) {
    index_2.default.error({ err }, 'Redis connection error');
});
redis.on('close', function () {
    index_2.default.warn('Redis connection closed');
});
exports.default = redis;
