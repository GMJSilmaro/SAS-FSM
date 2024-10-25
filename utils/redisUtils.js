// utils/redisUtils.js
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

// Cache durations (in seconds)
export const CACHE_DURATION = {
  CUSTOMERS_LIST: 300,    // 5 minutes
  CUSTOMER_DETAILS: 600,  // 10 minutes
  EQUIPMENT_LIST: 600     // 10 minutes
};

// Cache keys
export const CACHE_KEYS = {
  CUSTOMERS_LIST: 'customers:list:',
  CUSTOMER_DETAILS: 'customer:details:',
  EQUIPMENT_LIST: 'customer:equipment:'
};

export { redis };