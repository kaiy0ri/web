---
title: REST API & Postman
description: A small public read-only API, its endpoints, and the Postman collection that tests it every hour.
order: 5
updated: 2026-11-22
---

## What it is

A **REST API** lets programs ask a website for data over HTTP and get structured answers back (JSON). The Kaiyori API exposes the site's public data: site status and the changelog. It runs on Cloudflare Workers, which runs code at the network edge, and only for paths under `/api/`. Everything else on kaiyori.dev stays static files.

## Endpoints

Base URL: `https://kaiyori.dev`

| Method | Path | Returns |
| --- | --- | --- |
| GET | [`/api`](/api) | List of endpoints |
| GET | [`/api/health`](/api/health) | Service status and current version |
| GET | [`/api/changelog?limit=20`](/api/changelog?limit=5) | Recent changes; `limit` 1–100 |

Try it from a terminal:

```bash
curl https://kaiyori.dev/api/changelog?limit=5
```

## Postman

- **Collection:** [download it](/postman/kaiyori-api.postman_collection.json) and import it into Postman (File → Import). It has 4 requests with 10 automated tests, covering correct responses, security headers, and rejection of bad input.
- **OpenAPI spec:** [`/openapi.json`](/openapi.json) describes every endpoint in a standard format that Postman and other tools can import.
- **Automated:** the same collection runs **every hour** against the live API with Newman, Postman's command-line runner, as part of the [live checks](/docs/github-actions/).

## Security design

| Decision | Why |
| --- | --- |
| **Read-only** | Only `GET`, `HEAD` and `OPTIONS` are accepted. Anything else gets `405`. There's nothing to change, so nothing to tamper with. |
| **No authentication, no user data** | All data is already public, so there are no accounts to break into and no personal data to leak. |
| **Strict input validation** | `limit` must be a whole number from 1 to 100. Bad input gets a clear `400`, never a crash. |
| **Bounded output** | At most 100 changelog entries per request. |
| **No leaked internals** | Errors return a short code and message; stack traces are never sent. |
| **Hardened headers** | Every response sets `nosniff`, HSTS, `no-referrer` and a CSP that allows nothing to load. |
| **Open CORS, on purpose** | `Access-Control-Allow-Origin: *` is safe here *because* the data is public and nothing uses cookies. |

Source: [`worker/index.ts`](https://github.com/kaiy0ri/web/blob/main/worker/index.ts).
