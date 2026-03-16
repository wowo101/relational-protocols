import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import wikiLinkPlugin from "remark-wiki-link";

export default defineConfig({
  site: "https://wowo101.github.io",
  base: "/relational-protocols",
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [
      [
        wikiLinkPlugin,
        {
          pageResolver: (name) => [name.toLowerCase().replace(/\s+/g, "-")],
          hrefTemplate: (slug) => `/relational-protocols/${slug}/`,
          aliasDivider: "|",
        },
      ],
    ],
  },
});
