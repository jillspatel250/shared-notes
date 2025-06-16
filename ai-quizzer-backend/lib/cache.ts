// Redis caching implementation
// In production, use actual Redis client

interface CacheItem {
  key: string
  value: any
  expiry: number
}

// Mock in-memory cache (replace with Redis in production)
const cache = new Map<string, CacheItem>()

export async function getFromCache(key: string): Promise<any | null> {
  try {
    const item = cache.get(key)

    if (!item) {
      return null
    }

    if (Date.now() > item.expiry) {
      cache.delete(key)
      return null
    }

    return item.value
  } catch (error) {
    console.error("Cache get error:", error)
    return null
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<void> {
  try {
    const expiry = Date.now() + ttlSeconds * 1000
    cache.set(key, { key, value, expiry })
  } catch (error) {
    console.error("Cache set error:", error)
    // Don't throw error, caching is optional
  }
}

export async function deleteFromCache(key: string): Promise<void> {
  try {
    cache.delete(key)
  } catch (error) {
    console.error("Cache delete error:", error)
  }
}

export async function clearCache(): Promise<void> {
  try {
    cache.clear()
  } catch (error) {
    console.error("Cache clear error:", error)
  }
}

// Cache keys
export const CACHE_KEYS = {
  QUIZ: (id: string) => `quiz:${id}`,
  USER_HISTORY: (userId: number, filters: string) => `history:${userId}:${hashString(filters)}`,
  QUIZ_STATS: (quizId: string) => `stats:${quizId}`,
  AI_RESPONSE: (prompt: string) => `ai:${hashString(prompt)}`,
  HINT: (quizId: string, questionId: string) => `hint:${quizId}:${questionId}`,
}

// Utility function to hash strings for cache keys
function hashString(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString()

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36)
}

// Cache statistics
export async function getCacheStats(): Promise<{
  size: number
  keys: string[]
  hitRate?: number
}> {
  try {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    }
  } catch (error) {
    console.error("Cache stats error:", error)
    return { size: 0, keys: [] }
  }
}

// Clean expired cache entries
export async function cleanExpiredCache(): Promise<number> {
  try {
    let cleaned = 0
    const now = Date.now()

    for (const [key, item] of cache.entries()) {
      if (now > item.expiry) {
        cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  } catch (error) {
    console.error("Cache cleanup error:", error)
    return 0
  }
}

// Production Redis implementation (commented out for development)
/*
import Redis from 'redis'

const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redis.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

export async function getFromCache(key: string): Promise<any | null> {
  try {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<void> {
  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

export async function deleteFromCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis delete error:', error)
  }
}
*/
