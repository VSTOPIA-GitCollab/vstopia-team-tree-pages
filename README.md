# VSTOPIA — GitCollab Public Tree

**Public GitHub Pages preview**, with an animated and interactive tree and an encouraging supervisor. The tree's project names and node-level activity are explicitly **illustrative**. They are not private repo names or private contributor activity.

Five headline metrics are **real aggregated counts** from a narrowly selected subset of VSTOPIA-GitCollab repositories: repositories which both collaborators can access. These counts are intentionally published in `snapshot.json`. The file includes schema/version, scope, capture timestamp, aggregate organizational counts, and only the two user-authorized personal contribution and task-queue summaries. No repository identifiers, commit messages, PR titles, repository URLs, discussions, review details or credentials are included. **The owner explicitly approved public display** of the two collaborator names and GitHub handles, their total default-branch mapped commit counts, authored PR count, merged-by PR count, observed push events during the last 30 days, and the date/type of last recorded interaction. These personal aggregates are now intentionally public.

Push counts are **observed GitHub Events API PushEvent records for the last 30 days** and may not be complete if event history is truncated; they are not an all-time push count. The last recorded interaction is based on observable GitHub events, with a mapped commit timestamp fallback. Service account `VSTOPIA` contributions are **not** silently attributed to `ostinsolo`. These figures must not be presented as measures of effort or productivity.

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

## Assigned work and review requests

The public collaborator cards include aggregated **open issues assigned**, **open PRs assigned** and **explicit individual pending review requests** from GitHub. Draft PRs are excluded from the review-request tally. Issue and PR assignments are counted separately. A PR is not considered a review obligation merely because it is open; the user must be in its `requested_reviewers` collection. These counts are a pending work queue, **not** a productivity rating, deadline, or inference from lack of commits. Node names and individual per-project activity remain illustrative, not real.
