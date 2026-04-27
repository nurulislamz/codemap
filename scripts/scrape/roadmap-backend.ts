import { getSeedDate } from "./seed-date";
import { writeSeedFile } from "./write-seed";

async function main(): Promise<void> {
  const seedDate = getSeedDate();
  const force = process.argv.includes("--force");
  const markdown = `# Backend Roadmap
Source: https://roadmap.sh/backend
Seed Date: ${seedDate}
Review Status: curated starter seed
Seed Method: curated constants
Description: Backend engineering roadmap.

## Topic: Internet
Slug: internet
Description: Understand DNS, HTTP, browsers, hosting, and how clients reach servers.
Source: https://roadmap.sh/backend

- Resource: How does the internet work?
  URL: https://roadmap.sh/guides/what-is-internet
  Type: article
  Summary: High-level overview of networks, packets, DNS, and protocols.

## Topic: HTTP
Slug: http
Description: Understand methods, status codes, headers, caching, cookies, and TLS.
Source: https://roadmap.sh/backend

- Resource: HTTP in one picture
  URL: https://roadmap.sh/guides/http-in-one-picture
  Type: article
  Summary: Visual summary of request and response fundamentals.
`;

  await writeSeedFile("content/seeds/backend-roadmaps.md", markdown, { force });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
