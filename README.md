# VSTOPIA — GitCollab Public Tree

**Public GitHub Pages preview**, with an animated and interactive tree and an encouraging supervisor. The tree's project names and node-level activity are explicitly **illustrative**. They are not private repo names or private contributor activity.

Five headline metrics are **real aggregated counts** from a narrowly selected subset of VSTOPIA-GitCollab repositories: repositories which both collaborators can access. These counts are intentionally published in `snapshot.json`. The file includes only the schema version, scope label, capture timestamp, repository count, default-branch commit count, open Issue count, open Pull Request count and historical merged Pull Request count. No repository identifiers, commits, messages, author identities, URLs, discussions, review details or credentials are included.

## Static hosting

Publish the root of the public repository with GitHub Pages → Deploy from a branch → `main` → `/ (root)`.

- `index.html`, `style.css`, `app.js`: browser-only tree and supervisor, no API credentials.
- `snapshot.json`: deliberately public sanitized aggregates, initially generated from the private source with explicit allowlisting; refreshed by the **private** VSTOPIA Team Tree GitHub Action when owner-provided scoped secrets are configured.
- Reopening the page checks `snapshot.json` immediately. An open tab re-checks every 5 minutes. The private Action is configured to generate the snapshot hourly; GitHub scheduled workflows may run late.

## Important distinctions

- The displayed anonymous project labels and their per-node commit/Issue/PR example counts are **demonstration content**, not real data.
- Only the aggregate cards are backed by `snapshot.json`.
- All-time merges are a historical count, not merges today or this week.
- The public snapshot is visible to everyone. GitHub Pages provides no repository-member-only access in this deployment.
- Do not move the private source backend, personal contributor metrics, private repository names or tokens into this public repository.
- For private task details and collaborator-specific supervision, use the separately authenticated application, not public GitHub Pages.
