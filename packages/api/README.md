API package (TypeScript Express)

Setup (after cloning):

1. cd packages/api
2. npm install express mongoose dotenv jsonwebtoken bcryptjs cloudinary sendgrid-ts (or provider of choice) --save
   and dev deps: typescript ts-node-dev @types/express @types/node @types/mongoose
3. Copy .env.example to .env and fill in values
4. npm run dev

Frontends (scaffolded):
- apps/web (Next.js customer app) — run: cd apps/web && npm run dev
- apps/admin (Next.js admin app) — run: cd apps/admin && npm run dev

Notes:
- OTP endpoints are scaffolds in src/routes/auth.ts — implement secure OTP generation, storage, and email sending before using in production.
- Cloudinary helper stub at src/utils/cloudinary.ts — replace with real SDK calls.
