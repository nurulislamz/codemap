# System Design Prompts

Source: https://github.com/donnemartin/system-design-primer
Scraped Date: 2026-04-26
Review Status: manually curated starter seed

## Topic: URL Shortener
Slug: url-shortener
Description: Design short-link creation, redirect serving, analytics, and abuse controls.
Tags: hashing, storage, redirects, caching, rate limiting

### Prompt: Design TinyURL
Slug: design-tinyurl
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: key generation, redirects, read-heavy traffic, cache, analytics

Design a URL shortener that creates short links, redirects users to long URLs, and records basic analytics.

## Topic: Rate Limiter
Slug: rate-limiter
Description: Design controls that throttle API traffic across customers and distributed services.
Tags: distributed-systems, redis, counters, throttling

### Prompt: Design API Rate Limiter
Slug: design-api-rate-limiter
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: token bucket, fixed window, sliding window, redis, distributed consistency

Design a rate limiter for a public API used by many customers.
