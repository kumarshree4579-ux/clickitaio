import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.slice(7);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    // Check for token in cookie (set at login) or fall back to checking if it exists
    const hasToken = req.cookies.get('token')?.value;
    if (!hasToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (pathname === '/login') {
    const hasToken = req.cookies.get('token')?.value;
    if (hasToken) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
