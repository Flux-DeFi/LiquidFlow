import { rateLimit } from 'express-rate-limit';

/**
 * Number of reverse proxies in front of the Express app, used as the
 * `trust proxy` setting so that `req.ip` (and therefore per-client rate
 * limiting) resolves to the real client IP instead of a proxy address.
 *
 * Topology: client -> AWS Application Load Balancer -> nginx -> Express.
 *   - The ALB appends the client IP to `X-Forwarded-For` (hop 1).
 *   - nginx (devOps/nginx/nginx.conf) proxies to the backend (hop 2).
 * That is 2 trusted hops. We intentionally avoid `trust proxy: true`,
 * which would trust every upstream and let clients spoof `X-Forwarded-For`.
 */
export const TRUSTED_PROXY_HOPS = 2;

export const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window` (here, per minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: 'Too many requests, please try again later.',
    status: 429,
  },
});
