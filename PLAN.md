# Portfolio plan

Working notes, so decisions survive between sessions. Edit freely.

## Purpose

- A public place to show who I am and what I have built, and a notebook for what I am working out.
- Primary reader: someone with about a minute (a collaborator, or a recruiter for an internship or attachment). Second reader: someone curious who wants depth. The notebook serves the second reader.
- Position: a learner, stated honestly. What I claim must be backed by something a reader can open.
- The thread across fields: understanding how things work, layer by layer, down to the fundamentals (mathematics, then computers, networks, data).

## Decisions so far

- Keep Astro, Tailwind, one Svelte island, static hosting on Cloudflare. Fix the content and structure first.
- One source of truth for facts. The README stays short and points to the site.
- Projects are described as built with an AI coding assistant while I learn to code by hand. Revisit as that changes.
- Domain collinsmwangi.me expires Feb 2027. Probably move to a free subdomain. Keep the hostname in one place (`site` in `astro.config.mjs`) and do not use an address at this domain as the only contact.

## Phases

1. **Triage (this patch):** correct the IEEE 754 page, rebuild the visualizer around the 32 bits with tests, remove unsupported claims, align project stacks with the repositories, rewrite the README.
2. Upgrade Astro one major version at a time, then consider moving from Pages to Workers static assets.
3. Metadata: per-page descriptions, a purpose-made 1200x630 social card, `security.txt` (expires 2027-01-01, `Canonical` should be a full URL).
4. Headers and CSP, remove dead code and no-op tests.
5. Structure: home, notebook as a content collection, a plain timeline (education, internship), the other repositories.

## Open questions

- Which other repositories belong on the site, and how should each be described?
- Waste2Build: what is it, and should it be listed?
- Permission to show any ISP logo or poster work, or recreate my own.
- Which software did the ISP use (the one starting with "W")?
