# House Build Gantt

A lightweight web app to visualise and edit your residential house build schedule. Drag task bars on the chart, edit details in the sidebar, import/export Mermaid or JSON, and changes persist in the browser.

## Features

- Interactive Gantt chart (drag dates, adjust progress)
- Full task editor: name, duration, section, fixed start vs dependency
- Add/remove tasks and sections
- Mermaid import/export (compatible with your existing diagram syntax)
- JSON export/import for backups
- Auto-save to `localStorage`

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy on Coolify

1. Push this repo to Git (GitHub, Gitea, etc.).
2. In Coolify, create a new **Application** → **Dockerfile** build pack.
3. Point it at this repository; build context is the repo root.
4. Set **Ports Exposes** to **3100** (matches the container; no need to use host port 80).
5. Map to the host only if you need direct access, e.g. `13100:3100` — pick any free host port. The Cloudflare tunnel should target that host port, not 80.
5. Deploy. No runtime env vars required.

### Cloudflare Tunnel

Run `cloudflared` on the same host as Coolify (or wherever the container is reachable).

**Critical:** the tunnel `service` must be the **internal origin** (HTTP to the container), never the public hostname:

```yaml
# cloudflared config.yml — correct
ingress:
  - hostname: gantt.pureautomation.com.au
    service: http://127.0.0.1:<coolify-published-port>   # or http://<container-ip>:80
  - service: http_status:404
```

```yaml
# WRONG — causes ERR_TOO_MANY_REDIRECTS (307 loop)
ingress:
  - hostname: gantt.pureautomation.com.au
    service: https://gantt.pureautomation.com.au   # do not point the tunnel at itself
```

In Zero Trust → **Networks** → **Tunnels** → your tunnel → **Public Hostname**, set:

| Field | Value |
|--------|--------|
| Subdomain | `gantt` (or full hostname) |
| Service type | HTTP |
| URL | `127.0.0.1:3100` or `127.0.0.1:<host-port>` from Coolify’s port mapping (see below) |

**Tip:** Restrict access with Cloudflare Access (email OTP, Google, etc.) since the app has no built-in auth.

#### ERR_TOO_MANY_REDIRECTS

If the browser shows a redirect loop, the response is coming from **Cloudflare** (not this app — nginx only serves static files, no redirects).

1. **Tunnel service URL** — must be `http://127.0.0.1:<port>` or Coolify’s internal HTTP URL, not `https://gantt.pureautomation.com.au`.
2. **Coolify** — if the app is only reached via the tunnel, turn off extra “Force HTTPS” / redirect middleware on this service (Cloudflare edge already serves HTTPS).
3. **Cloudflare SSL** — for tunnel-only origins use **Full** or **Full (strict)**; avoid **Flexible** if anything on the path redirects to HTTPS.
4. **Redirect Rules** — Zero Trust / zone **Rules** → check nothing rewrites `gantt.pureautomation.com.au` to the same URL.
5. **Access** — if enabled, temporarily disable the Access application for this hostname to test; misconfigured Access can 307-loop before the app loads.
6. **Verify origin** — on the server: `curl -I http://127.0.0.1:3100/` (or your mapped host port) should return `200` and `text/html`, not `307`.

#### Ports (no conflict with other apps on :80 or :3000)

- The container listens on **3100** internally (nginx). It does **not** require host port 80.
- In Coolify: **Ports Exposes** = `3100`. Use **Ports Mappings** like `13100:3100` if you want a fixed host port — choose any free port.
- Point the Cloudflare tunnel at **`http://127.0.0.1:13100`** (mapped host port) or whatever Coolify shows after deploy — **not** `https://gantt.pureautomation.com.au`.
- Remove the Coolify public FQDN if you only use the tunnel, to avoid HTTPS redirect loops with Traefik.

## Data persistence

Edits are stored in each browser’s `localStorage`. Use **Export JSON** before clearing cache or switching devices. For shared team storage, mount a volume and add a small API later — the JSON export format is the source of truth.

## Stack

- React + Vite + TypeScript
- [Frappe Gantt](https://github.com/frappe/gantt) for the chart
- nginx (Alpine) in production Docker image
