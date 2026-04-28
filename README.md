# Jewel Finance

This project now uses backend-owned Django sessions for login. The Next.js app keeps the same UI, but it no longer trusts a client-supplied username header or a fake local auth flag.

## Secure deployment

1. Copy [backend/.env.example](/e:/jewel%20finanace/backend/.env.example) to `backend/.env` and set real production values.
2. Copy [frontend/.env.example](/e:/jewel%20finanace/frontend/.env.example) to `frontend/.env.local` and point `NEXT_PUBLIC_DJANGO_API_URL` at the deployed Django backend.
3. Run Django with `DEBUG=False`, a strong `SECRET_KEY`, explicit `ALLOWED_HOSTS`, explicit `CSRF_TRUSTED_ORIGINS`, and create real users through `createsuperuser` or the signup API.
4. Put Django behind HTTPS and a reverse proxy that forwards `X-Forwarded-Proto`.
5. Run `python manage.py migrate` and create a real admin user with `python manage.py createsuperuser`.
6. Keep the backend on a private network or firewall it to the frontend/reverse proxy whenever possible.
7. Serve customer media and document files from private storage or an authenticated proxy. Do not expose raw proof/document media from a public bucket or open file server in production.
8. On Render, either set the service Root Directory to `backend` with start command `gunicorn jewel_finance.wsgi --bind 0.0.0.0:$PORT`, or deploy from the repo root with start command `cd backend && gunicorn jewel_finance.wsgi --bind 0.0.0.0:$PORT`.

## Frontend on Render

Deploy the Next.js app as a separate Render Static Site:

1. Create a new Static Site in Render from this repository.
2. Set the Root Directory to `frontend`.
3. Set the Build Command to `npm install && npm run build`.
4. Set the Publish Directory to `out`.
5. Add `NEXT_PUBLIC_DJANGO_API_URL=https://fianance-management-system-erp.onrender.com` as an environment variable.
6. After Render assigns the frontend URL, add that exact origin to the backend service's `CSRF_TRUSTED_ORIGINS` so login and other authenticated writes work from the static site domain.

The checked-in [render.yaml](/E:/jewel_finanace/render.yaml:1) contains the same Static Site settings if you prefer to create the service from a Blueprint.

## What was hardened

- Login now creates a real Django session instead of trusting a forged username header.
- Profile, settings, customer, password, photo, and logout endpoints now require backend authentication.
- Mutating backend routes are protected by CSRF instead of `@csrf_exempt`.
- Session and CSRF cookies are forwarded securely through the Next.js API layer.
- Demo seed accounts are removed, and fresh deployments should create real users explicitly.
- Production settings now require explicit secrets and safer security headers/cookie settings.
- Login attempts are rate limited.
