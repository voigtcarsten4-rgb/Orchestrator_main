# Wave Bite — ELWIS Proxy (Cloudflare Worker)

Apps Script POSTs to `nts40.elwis.de` are blocked at WAF level (verified
empirically: GET=200, all 4 POST header variants return *Address unavailable*).
This Worker runs on Cloudflare's edge IPs which are **not** on the blocklist,
makes the SOAP call, and returns clean JSON to Apps Script.

## Endpoints

| Path | Method | Description |
|---|---|---|
| `/health` | GET | Liveness check |
| `/elwis/nts?message_type=FTM&days_back=14&limit=50` | GET | One message type |
| `/elwis/nts/multi?message_types=FTM,WRM&days_back=14` | GET | Multiple types in one call |

Each successful call returns:

```json
{
  "ok": true,
  "message_type": "FTM",
  "count": 7,
  "raw_bytes": 12340,
  "messages": [
    { "source": "FTM", "notice_id": "2026-1234", "title": "...",
      "area": "...", "waterway": "...",
      "valid_from": "...", "valid_to": "...", "published_at": "...",
      "raw_text": "..." }
  ],
  "fetched_at": "2026-05-02T10:00:00Z"
}
```

## One-time deploy (≈5 minutes)

You need a free Cloudflare account ([dash.cloudflare.com](https://dash.cloudflare.com)).
Free tier covers 100k requests/day — plenty for Wave Bite.

```bash
cd cloud-proxy
npm install
npx wrangler login           # opens browser; one-time
npx wrangler deploy          # creates the worker, prints its URL
```

Output ends with something like:
```
Published wave-bite-elwis-proxy
  https://wave-bite-elwis-proxy.<your-subdomain>.workers.dev
```

Copy that URL — you'll paste it into Apps Script.

### Optional auth (recommended)

Generate any random string (≥ 32 chars) and store it as a secret:

```bash
npx wrangler secret put PROXY_API_KEY
# paste the random string when prompted
```

When `PROXY_API_KEY` is set, the Worker rejects any request without
matching `x-api-key` header.

## Apps Script side

In the Apps Script editor:

1. **Project Settings (⚙️)** → **Script properties** → **Add property**
2. Add:
   - `ELWIS_PROXY_URL` = `https://wave-bite-elwis-proxy.<your-subdomain>.workers.dev`
   - `ELWIS_PROXY_API_KEY` = (same string you pasted into Wrangler — leave empty if no auth)
3. Save
4. Run `runElwisFetch` → echte ELWIS-Daten landen in Sheet `Elwis_Notices`

The Apps Script pipeline already detects these properties automatically. If
they're not set, the pipeline falls back to direct SOAP/HTML attempts (which
will fail honestly with `pipeline_status: unreachable...`) — nothing breaks.

## Verify

After deploy:

```bash
# Health check (works without auth)
curl https://wave-bite-elwis-proxy.<your-subdomain>.workers.dev/health

# With API key
curl -H "x-api-key: <your-secret>" \
  "https://wave-bite-elwis-proxy.<your-subdomain>.workers.dev/elwis/nts?message_type=FTM"
```

If you see `count > 0` in the response, you're live.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `unauthorized` | Missing/wrong `x-api-key` | Use the same key you set in `wrangler secret put` |
| `upstream_http_5xx` | ELWIS NTS server side issue | Wait, retry; check ELWIS status page |
| `count: 0` | No notices in the `days_back` window | Increase `days_back`, e.g. `?days_back=30` |
| Worker URL 404s | Worker name typo / not deployed | Re-run `wrangler deploy` |

## Limits

- Cloudflare free tier: 100k requests/day, 10ms CPU/req
- Worker caches each upstream response 3 min (`Cache-Control: max-age=180`)
- Max `limit` per call: 200 messages

## Security notes

- The Worker only forwards `GET` requests. There's no body-injection vector.
- The upstream URL (`nts40.elwis.de`) is hard-coded — clients can't pivot.
- API key is optional but recommended on a public Worker.
- If the key leaks, rotate via `wrangler secret put PROXY_API_KEY` and update
  Script properties.
