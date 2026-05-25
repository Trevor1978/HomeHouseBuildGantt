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
4. Expose port **80** (container) — Coolify will map it as needed.
5. Deploy. No runtime env vars required.

### Cloudflare Tunnel

Run `cloudflared` on the same host as Coolify (or wherever the container is reachable):

```yaml
# Example tunnel ingress (cloudflared config.yml)
ingress:
  - hostname: gantt.yourdomain.com
    service: http://localhost:<coolify-assigned-port>
  - service: http_status:404
```

In Cloudflare Zero Trust → Tunnels, create a public hostname pointing at the Coolify service URL (often `http://127.0.0.1:<port>` on the server).

**Tip:** Restrict access with Cloudflare Access (email OTP, Google, etc.) since the app has no built-in auth.

## Data persistence

Edits are stored in each browser’s `localStorage`. Use **Export JSON** before clearing cache or switching devices. For shared team storage, mount a volume and add a small API later — the JSON export format is the source of truth.

## Stack

- React + Vite + TypeScript
- [Frappe Gantt](https://github.com/frappe/gantt) for the chart
- nginx (Alpine) in production Docker image
