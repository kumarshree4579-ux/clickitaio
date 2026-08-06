Utilities for the API

- mailer.ts: sends OTP emails using SendGrid when SENDGRID_API_KEY is set; otherwise logs the OTP to console (development fallback).
- jwt.ts: helpers for signing access and refresh tokens. Configure JWT_SECRET and JWT_REFRESH_SECRET in .env.
