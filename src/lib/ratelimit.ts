import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

//UpSTASH RATELIMITING

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "10s"), // 200 requests per 10 seconds - increased for frequent refetching
});

export const uploadRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1d"),
  prefix: "@upstash/ratelimit/upload",
});

export const publicRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(50, "10s"),
  prefix: "@upstash/ratelimit/public",
});

export const messageRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10s"),
  prefix: "@upstash/ratelimit/message",
});

export const commentRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1m"),
  prefix: "@upstash/ratelimit/comment",
});