# Auth And Deploy Notes

Updated: 2026-07-01

- Production Next.js runs on the VM as `relogator.service` with `WorkingDirectory=/opt/relogator/current`.
- The service reads public runtime env from `/opt/relogator/shared/.env.production`; `NEXT_PUBLIC_SITE_URL` is set to `https://relogator.ru`.
- Supabase Auth `site_url` is `https://relogator.ru`.
- Supabase Auth redirect allow list intentionally excludes `http://localhost:3000/**` and `http://127.0.0.1:3000/**` so production auth emails cannot redirect users to a local address.
- Confirmation emails use a custom Supabase template link based on `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`; the app passes `https://relogator.ru/auth/confirm?next=...` as `emailRedirectTo`.
- Recovery emails should send users through the configured callback/new-password flow and then to the intended in-app page.
- If a confirmation email opens `localhost`, check both Supabase Auth URL Configuration and the custom email template. The template must not hardcode `localhost` or rebuild the link from a stale `{{ .SiteURL }}` when the app already passes `emailRedirectTo`.
