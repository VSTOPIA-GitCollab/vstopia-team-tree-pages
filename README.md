# VSTOPIA Team Tree — Public Preview

Static, animated [GitHub Pages](https://pages.github.com/) visualization built with plain HTML, CSS and JavaScript. This **public** repository contains **no private GitHub data, credentials, internal repository names, or collaborator work records**.

The 12 animated project nodes, counts and missions are **DEMONSTRATION DATA**, not company activity. The banner, labels and inspector mark them as such. Real private statistics require an explicitly approved, scheduled aggregation and publication workflow with an allowlisted JSON schema.

## Safety requirements

- Never publish private repository names, commit authors, PR/Issue titles, GitHub commit URLs, personal identifiers, agent records or API tokens.
- A GitHub Pages site is publicly accessible regardless of private source repositories used by an exporter.
- The public page must **not** contact private GitHub APIs. Any optional `activity.json` must be static, generated server-side, schema-validated and explicitly whitelisted.
- Never represent demo numbers as real metrics. Label every published activity total with the period and last updated timestamp.
- Any private-to-public exporter must live and run in a private repo with separate least-privilege GitHub credentials. Public Actions should only deploy static, pre-sanitized files.

## Local preview

```bash
python3 -m http.server 38973 --bind 127.0.0.1
```

Open http://127.0.0.1:38973/ .
