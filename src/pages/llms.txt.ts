// llms.txt: a plain-text map of the site for AI assistants and answer engines (llmstxt.org).
import { getCollection } from "astro:content";
import { site } from "../site";

export async function GET() {
  const docs = (await getCollection("docs")).sort((a, b) => a.data.order - b.data.order);
  const lines = [
    `# ${site.brand.name}`,
    "",
    `> ${site.brand.description}`,
    "",
    `${site.brand.name} (${site.brand.pronounce}) is a product-management SaaS at the idea stage (not built or launched yet; early access by email), planned by ${site.name}. It is meant to turn an idea into an MVP. Owner's personal site: https://camtoan.me`,
    "",
    "## Main pages",
    "",
    "- [Public API](https://kaiyori.dev/openapi.json): read-only JSON API for site status and the changelog (GET /api/health, /api/changelog)",
    "- [Changelog](https://kaiyori.dev/changelog/): every change in plain English",
    "",
    "## Docs",
    "",
    ...docs.map((d) => `- [${d.data.title}](https://kaiyori.dev/docs/${d.id}/): ${d.data.description}`),
    "",
    "## Optional",
    "",
    "- [Legal & privacy](https://kaiyori.dev/legal/)",
    "- [Security & disclosure](https://kaiyori.dev/security/)",
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
