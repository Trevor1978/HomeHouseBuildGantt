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
4. Set **Ports Exposes** to **3100** (must match nginx inside the container).
5. Set **Ports Mappings** to **`3100:3100`** (or `13100:3100` if 3100 is taken on the host). **Required for Cloudflare tunnel** — without this, `curl http://127.0.0.1:3100` on the VM will fail even when the app is healthy.
5. Add a **Persistent Storage** mount in Coolify:
   - Mount path: `/data`
   - Keep default volume settings (or choose a named volume)
6. Deploy. No runtime env vars required.

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
- In Coolify: **Ports Exposes** = `3100` and **Ports Mappings** = `3100:3100` (host:container). If host 3100 is busy, use `13100:3100` and point the tunnel at port **13100**.
- Point the Cloudflare tunnel at **`http://127.0.0.1:3100`** (left side of the mapping) — **not** `https://gantt.pureautomation.com.au`.
- **Ports Exposes alone does not open the host port** — that is why `curl http://127.0.0.1:3100` fails until mappings are set.
- Remove the Coolify public FQDN if you only use the tunnel, to avoid HTTPS redirect loops with Traefik.

## Data persistence

Edits are now saved in two places:

- Browser `localStorage` (fast local fallback)
- Server file at `/data/project.json` via `/api/project` (survives redeploys when `/data` is a persistent volume)

If `/data` is not mounted as persistent storage, changes can still be lost when the container is recreated. Use **Export JSON** for manual backups.

## Stack

- React + Vite + TypeScript
- [Frappe Gantt](https://github.com/frappe/gantt) for the chart
- Node.js runtime serving static files + `/api/project`
