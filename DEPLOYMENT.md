# Deploying the Template Lab on Railway

Two things to do: add **two variables to the existing backend service**, and create
**one new service** for the Lab frontend.

No shell access is needed. Database migrations run automatically on backend start, and
developer accounts are created from the admin panel (**Internal → Developers**).

---

## 1. Backend service — add two variables

The Lab needs the API to know it exists.

| Variable | Value | Required? |
|---|---|---|
| `LAB_URL` | `https://lab.aamantran.online` | Only if you use a different domain |
| `JWT_SECRET_DEV` | a long random string | Recommended |

**`LAB_URL`** does two jobs, and both fail silently if it is wrong:

1. Adds the Lab to the CORS allow-list — otherwise every Lab API call is blocked.
2. Widens `frame-ancestors` on **sandbox invites only**, so the Lab's device-preview
   iframe can embed them. A real couple's invitation keeps `frame-ancestors 'self'`.

If your Lab lives at exactly `https://lab.aamantran.online` you can skip it — that is
already the production default in `src/config/siteUrls.js`. Set it for any other domain.

**`JWT_SECRET_DEV`** signs developer tokens. It falls back to `JWT_SECRET`, and tokens
are safe either way because the issuer and role are both checked — but a separate secret
means rotating Lab access can never disturb admin or couple sessions.

Nothing else changes. `prestart` already runs `prisma migrate deploy`, so the
`20260829000000_template_lab` migration applies on the next deploy with no action.

---

## 2. Lab service — new

Create a service from the same repository.

| Setting | Value |
|---|---|
| Root directory | `aamantran_lab` |
| Build command | `npm run build` (Railway default) |
| Start command | `npm start` (Railway default) |

Both scripts are in `package.json`, so Railway's defaults are correct and there is
nothing to type into the dashboard.

### Variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.aamantran.online` |
| `VITE_PUBLIC_INVITE_BASE_URL` | `https://api.aamantran.online` |

`PORT` is injected by Railway; `serve` reads it automatically. Do not set it yourself.

> **These are baked in at build time.** Vite substitutes `VITE_*` during `npm run build`,
> not at runtime — so they must exist *before* the first build, and changing one requires
> a redeploy, not a restart. Setting them on a already-built service does nothing.

`VITE_PUBLIC_INVITE_BASE_URL` is the URL a developer copies and the one encoded into the
QR code. It has to be reachable from a phone: if it is wrong, the in-app preview still
works and only the QR silently fails, which is a slow thing to notice.

### Domain

Add `lab.aamantran.online` as a custom domain on this service and point the CNAME at it.
Keep it consistent with `LAB_URL` on the backend.

---

## 3. After the first deploy

1. Open the admin panel → **Internal → Developers**.
2. **Add developer** — name, handle, email. Leave the password blank to generate one.
3. Copy the Lab URL, handle and password from the one-time modal and send them on.

The password is shown once and is not retrievable; if it is lost, use **Rotate password**.
The handle becomes that developer's permanent invite slug (`/i/lab-<handle>`) and cannot
be changed later.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Lab loads, every API call fails with a CORS error | `LAB_URL` on the **backend** does not match the Lab's real origin |
| Device preview panel is blank, console shows a frame-ancestors error | Same — `LAB_URL` wrong or unset on the backend |
| Direct hit on `/sandbox` or `/preview` 404s | Start command is not `npm start`; `serve -s` provides the SPA fallback |
| QR code will not open on a phone | `VITE_PUBLIC_INVITE_BASE_URL` points at localhost or an unreachable host |
| API calls go to the Lab's own domain instead of the API | `VITE_API_URL` was missing **at build time** — redeploy after setting it |
| Build fails on a missing `vite` | Railway pruned devDependencies; set `NPM_CONFIG_PRODUCTION=false` on the service |

---

## Maintenance (needs the Railway CLI locally)

`npm run storage:orphans` sweeps template folders that no database row points at. It is
not needed routinely — deleting a developer now removes their files — and exists for
folders stranded before that was fixed.

It is deliberately **not** exposed in the admin panel, because "orphaned" means "unknown
to the database this process is connected to". Point a local `.env` at the production
bucket and every live template looks orphaned. The script refuses to delete unless you
pass `--confirm=<bucket-name>` read off its own banner, and aborts if more than half the
folders look orphaned — but a UI button would invite exactly that mistake.

```bash
railway run npm run storage:orphans                            # dry run
railway run npm run storage:orphans -- --apply --confirm=<bucket>
```
