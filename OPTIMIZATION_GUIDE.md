
# High-Traffic Optimization Guide for Booster

## ✅ Already Implemented

### Database Indexes
- Added indexes on `messages` table (sender, receiver, created_at, unread messages)
- Added indexes on `notifications` table (userId, unread notifications, created_at)
- Added indexes on `videos` table (userId, categoryId, visibility/status, created_at, featured)

**Next Step**: Push indexes to database
```bash
bunx drizzle-kit push
```

---

## 🚀 Critical Optimizations to Implement

### 1. **Database Connection Pooling**
**Current**: Neon Serverless (already pooled ✅)
Your Neon PostgreSQL already uses connection pooling, but verify settings:

**Recommended**: 
- Set `connectionString` pool size in production
- Use Neon's connection pooling (already enabled)
- Monitor active connections in Neon dashboard

---

### 2. **Caching Strategy**

#### A. Add Redis for Hot Data
```bash
bun add ioredis
bun add -D @types/ioredis
```

**Create**: `src/lib/cache.ts`
```typescript
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL!);

// Cache helpers
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

export const cacheSet = async (key: string, value: any, ttl = 300) => {
  await redis.setex(key, ttl, JSON.stringify(value));
};

export const cacheInvalidate = async (pattern: string) => {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
};
```

**Cache These**:
- User profiles (TTL: 5 mins)
- Video metadata (TTL: 10 mins)
- Trending/featured videos (TTL: 1 min)
- Follower counts (TTL: 30 secs)
- Message unread counts (TTL: 10 secs)

---

### 3. **Rate Limiting**

#### Update `src/lib/ratelimit.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limits for different actions
export const messagingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 messages per minute
  analytics: true,
});

export const notificationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 notifications per minute
  analytics: true,
});

export const searchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 searches per minute
  analytics: true,
});
```

**Apply to procedures**:
```typescript
// In messages/server/procedures.ts
sendMessage: protectedProcedure
  .mutation(async ({ input, ctx }) => {
    const { success } = await messagingRateLimit.limit(ctx.user.id);
    if (!success) {
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
    }
    // ... rest of code
  })
```

---

### 4. **Query Optimization**

#### A. Pagination Everywhere
Already using cursor pagination ✅ but ensure all lists use it:
- Messages conversations
- Notifications
- Video feeds
- Search results

#### B. Selective Field Loading
```typescript
// Instead of SELECT *
.select({
  id: users.id,
  name: users.name,
  imageUrl: users.imageUrl,
  // Only fields you need
})
```

#### C. Batch Queries
Use `Promise.all()` for independent queries:
```typescript
const [user, followers, videos] = await Promise.all([
  getUserQuery,
  getFollowersQuery,
  getVideosQuery
]);
```

---

### 5. **Real-time Polling Optimization**

**Current**: Polling every 5-30 seconds
**Improvement**: Use websockets or long-polling

#### Option A: Server-Sent Events (SSE)
```typescript
// src/app/api/messages/stream/route.ts
export async function GET(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      // Send updates when new messages arrive
      setInterval(async () => {
        const newMessages = await checkNewMessages();
        controller.enqueue(JSON.stringify(newMessages));
      }, 1000);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  });
}
```

#### Option B: Increase Polling Intervals
```typescript
// Less critical data can poll slower
refetchInterval: 60000, // 1 minute instead of 30 seconds
```

---

### 6. **Image Optimization**

**Already using**: Next.js Image component ✅

**Add**:
- WebP format support
- Responsive images
- Lazy loading (already implemented)
- CDN caching headers

---

### 7. **API Route Optimization**

#### Add Edge Runtime for Fast Endpoints
```typescript
// src/app/api/health/route.ts
export const runtime = 'edge';

export async function GET() {
  return Response.json({ status: 'ok' });
}
```

---

### 8. **Monitoring & Observability**

#### A. Add Sentry for Error Tracking
```bash
bun add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  environment: process.env.NODE_ENV,
});
```

#### B. Add Performance Monitoring
```typescript
// Monitor slow queries
import { performance } from 'perf_hooks';

const start = performance.now();
const result = await db.query();
const duration = performance.now() - start;

if (duration > 1000) {
  console.warn(`Slow query: ${duration}ms`);
}
```

---

### 9. **Database Query Limits**

Add safety limits to prevent runaway queries:
```typescript
// Max 100 results per query
.limit(Math.min(input.limit, 100))
```

---

### 10. **Content Delivery (CDN)**

**Already using**: Vercel Edge Network ✅

**Ensure**:
- Static assets cached at edge
- API responses cached when possible
- Set proper `Cache-Control` headers

```typescript
export const revalidate = 300; // 5 minutes
```

---

## 📊 Load Testing

Before going live, test with:

### A. Artillery.io
```bash
bun add -D artillery
```

```yaml
# load-test.yml
config:
  target: 'https://your-app.com'
  phases:
    - duration: 60
      arrivalRate: 100 # 100 users/sec
scenarios:
  - flow:
    - get:
        url: "/"
    - post:
        url: "/api/trpc/messages.sendMessage"
```

```bash
artillery run load-test.yml
```

### B. k6
```bash
k6 run --vus 100 --duration 30s load-test.js
```

---

## 🎯 Priority Order

### Phase 1 (Do Now):
1. ✅ Push database indexes
2. Add rate limiting to messaging
3. Add error monitoring (Sentry)
4. Test with load testing tool

### Phase 2 (Next Week):
1. Add Redis caching for hot data
2. Optimize polling intervals
3. Add performance monitoring
4. Database connection pool tuning

### Phase 3 (Before Launch):
1. Implement WebSockets for real-time
2. Add comprehensive logging
3. Set up alerting (Vercel/Sentry)
4. Load test with 1000+ concurrent users

---

## 📈 Monitoring Metrics

Track these in production:
- **Response Times**: p50, p95, p99
- **Error Rates**: 4xx, 5xx
- **Database**: Query times, connection pool usage
- **Cache**: Hit rate, miss rate
- **Messages**: Send rate, delivery time
- **Active Users**: Concurrent connections

---

## 🔧 Environment Variables Needed

```env
# Redis
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...

# Database (already have)
DATABASE_URL=...
```

---

## 🚨 Emergency Scaling

If traffic spikes suddenly:
1. **Increase Vercel plan** (automatic scaling)
2. **Scale Neon database** (Neon console)
3. **Enable aggressive caching**
4. **Disable non-critical features** temporarily
5. **Add rate limits** more aggressively

---

## ✅ Current Strengths

Your app already has:
- ✅ Serverless architecture (auto-scaling)
- ✅ Edge network (Vercel)
- ✅ Connection pooling (Neon)
- ✅ Cursor pagination
- ✅ Optimized images
- ✅ Code splitting
- ✅ Some indexes

You're in good shape! Focus on caching and monitoring next.
