import { writeSeedFile } from "./write-seed";

async function main(): Promise<void> {
  const scrapedDate = new Date().toISOString().slice(0, 10);
  const markdown = `# System Design Prompts

Source: https://github.com/donnemartin/system-design-primer
Scraped Date: ${scrapedDate}
Review Status: scraper starter output

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

### Prompt: Design an API Rate Limiter
Slug: design-api-rate-limiter
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: token bucket, fixed window, sliding window, redis, distributed consistency

Design a rate limiter for a public API used by many customers.

## Topic: News Feed
Slug: news-feed
Description: Design ranked feeds for users following accounts that publish frequently.
Tags: fanout, ranking, feeds, caching

### Prompt: Design a News Feed
Slug: design-news-feed
Difficulty: hard
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: fanout on write, fanout on read, ranking, cache invalidation

Design a personalized news feed for users following many accounts.

## Topic: Chat System
Slug: chat-system
Description: Design direct and group messaging with low latency and reliable delivery.
Tags: websocket, persistence, delivery, presence

### Prompt: Design WhatsApp
Slug: design-whatsapp
Difficulty: hard
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: websocket gateways, message ordering, offline delivery, presence

Design a one-to-one and group chat service with reliable message delivery.

## Topic: File Storage
Slug: file-storage
Description: Design durable object storage, metadata, sharing, and client sync.
Tags: object-storage, metadata, upload, permissions

### Prompt: Design Dropbox
Slug: design-dropbox
Difficulty: hard
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: chunked upload, metadata store, sync, conflict resolution

Design a file storage and sync service for large files across devices.

## Topic: Notification System
Slug: notification-system
Description: Design multi-channel delivery with user preferences and retry handling.
Tags: queues, email, push, preferences

### Prompt: Design a Notification System
Slug: design-notification-system
Difficulty: medium
Source: https://github.com/donnemartin/system-design-primer
Expected Concepts: queues, delivery providers, retries, preferences, deduplication

Design a notification system that can send email, push, and in-app messages.
`;

  await writeSeedFile("content/seeds/system-design-prompts.md", markdown);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
