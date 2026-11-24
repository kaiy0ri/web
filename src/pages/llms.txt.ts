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
    `${site.brand.name} (${site.brand.pronounce}) is a product-management SaaS in early access (not launched yet), built by ${site.name}. It turns an idea into an MVP. Owner's personal site: https://camtoan.me`,
    "",
    "## Main pages",
    "",
    "- [Public API](https://kamllistos.com/openapi.json): read-only JSON API for site status and the changelog (GET /api/health, /api/changelog)",
    "- [Changelog](https://kamllistos.com/changelog/): every change in plain English",
    "",
    "## Docs",
    "",
    ...docs.map((d) => `- [${d.data.title}](https://kamllistos.com/docs/${d.id}/): ${d.data.description}`),
    "",
    "## Optional",
    "",
    "- [Legal & privacy](https://kamllistos.com/legal/)",
    "- [Security & disclosure](https://kamllistos.com/security/)",
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
