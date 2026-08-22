import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Footer from '../components/Footer';
import NotificationBar from '../components/NotificationBar';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: {
    default: 'Ecom Store',
    template: '%s | Ecom Store',
  },
  description: 'Your one-stop shop for everything you need',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ecom Store',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ecom Store',
    title: 'Ecom Store',
    description: 'Your one-stop shop for everything you need',
  },
};

import MobileBottomNav from '../components/MobileBottomNav';

async function getSettings() {
  try {
    // using absolute URL for server-side fetch
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
    const res = await fetch(`${apiUrl}/settings/public`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  
  const themeStyles = settings?.appTheme ? {
    '--color-primary': settings.appTheme.primaryColor || '#4f46e5',
    '--color-secondary': settings.appTheme.secondaryColor || '#7c3aed',
  } as React.CSSProperties : {
    '--color-primary': '#4f46e5',
    '--color-secondary': '#7c3aed',
  };

  return (
    <html lang="en" className={`${geist.variable} h-full`} style={themeStyles} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-gray-50 pb-16 sm:pb-0">
        <NotificationBar />
        {children}
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
