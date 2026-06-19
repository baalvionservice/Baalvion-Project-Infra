# Amarisé Maison Avenue — Go-Live (payments + photos)

Run this AFTER `DEPLOY-AWS.md` (the storefront + catalog are already live with
`PAYMENTS_MOCK=true`). This switches on **real checkout** and real photography.

---

## 1. Switch on real payments

Amarisé's checkout runs through **order-service**: the browser opens the provider's
popup/redirect, order-service creates the *server-priced* order and validates the
gateway's signed webhook. Keys live in `order-service` env.

1. Put your live (or test, to rehearse) keys into `deploy/amarise-maison-avenue/.env.prod`:
   ```bash
   PAYMENTS_MOCK=false
   # Stripe (US/UK/EU/luxury):
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   # and/or Razorpay (IN/AE):
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_WEBHOOK_SECRET=...
   ```
   > Razorpay enforces a per-transaction amount cap — for very high-value pieces route
   > those to Stripe (or bank transfer / concierge) and keep Razorpay for lower tickets.

2. Apply (only order-service needs the new env):
   ```bash
   export CF="--env-file deploy/amarise-maison-avenue/.env.prod -f deploy/amarise-maison-avenue/docker-compose.prod.yml"
   docker compose $CF up -d order-service
   ```

3. Register the webhook(s) in each provider dashboard (point at this exact URL; the secret
   MUST match the env value above):
   - **Stripe:**   `https://amarisemaisonavenue.com/svc/order/api/v1/orders/webhooks`
                   events: `checkout.session.completed`, `payment_intent.succeeded`, `*.payment_failed`
   - **Razorpay:** `https://amarisemaisonavenue.com/svc/order/api/v1/orders/webhooks/razorpay`
                   events: `payment.captured`, `payment.failed`
   - **PayU:**     `https://amarisemaisonavenue.com/svc/order/api/v1/orders/webhooks/payu`

4. **Rehearse with test mode first** (test keys + `PAYMENTS_MOCK=false`): place a low-value
   order end-to-end, confirm the order moves to PAID/CAPTURED and a tampered/forged webhook
   is rejected (`docker compose $CF logs -f order-service`). Then swap test keys → live keys
   and `docker compose $CF up -d order-service` again.

## 2. Real product + editorial photos
Photos are admin-controlled — no redeploy needed:
- **Per product:** Admin → Commerce → Products → edit → upload images (or Media library → paste URL).
- **Homepage / press / collections:** Admin → CMS → *Amarise Maison Avenue* → `homepage` (and `press`):
  edit the `hero.image`, `featuredCollections[].image`, press logos/articles with uploaded Media URLs.
- **Bulk import** (optional): drop files named `<product-slug>-1.jpg …` on a CDN, set
  `SEED_MEDIA_BASE_URL=https://<cdn>` in `.env.prod`, and re-run the catalog seed:
  ```bash
  docker compose $CF --profile tools run --rm \
    -e AMARISE_ORG_ID=<org> -e AMARISE_OWNER_ID=<user> commerce-seed
  ```
  Until real photos land, missing images render as elegant Amarisé branded panels (never broken).

## 3. Go-live checklist
- [ ] `https://amarisemaisonavenue.com` loads over valid TLS; `www` redirects to apex.
- [ ] Homepage sections + product grid render; `/us/press`, `/us/about` render.
- [ ] Sign-up / log-in / password-reset work (auth-service + SES email configured).
- [ ] A **real** test order completes; webhook marks it PAID; forged webhook rejected.
- [ ] Order-confirmation + password-reset emails deliver (SMTP/SES set).
- [ ] At least the hero + top sellers have real photography (rest can follow live).
- [ ] DB backup taken (`pg_dump`) and `caddy_data` + `pgdata` volumes snapshotted.
- [ ] (Recommended) start the hardening backlog in `DEPLOY-AWS.md §11`.

## 4. Rollback
- Bad deploy: `git checkout <prev> && docker compose $CF up -d --build`.
- Payments misbehaving: set `PAYMENTS_MOCK=true` + `docker compose $CF up -d order-service`
  (storefront stays up; checkout reverts to auto-confirm) while you investigate.
```
