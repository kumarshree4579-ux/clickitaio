import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.slice(7);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    const hasToken = req.cookies.get('token')?.value;
    const hasRefreshToken = req.cookies.get('refreshToken')?.value;
    if (!hasToken && !hasRefreshToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (pathname === '/login') {
    const hasToken = req.cookies.get('token')?.value;
    const hasRefreshToken = req.cookies.get('refreshToken')?.value;
    if (hasToken || hasRefreshToken) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
