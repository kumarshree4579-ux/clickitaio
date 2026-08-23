import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Footer from '../components/Footer';
import NotificationBar from '../components/NotificationBar';
import MobileBottomNav from '../components/MobileBottomNav';
import SplashLoader from '../components/SplashLoader';
import { LocationProvider } from '../lib/LocationContext';
import GlobalLocationPrompt from '../components/GlobalLocationPrompt';
import RealtimeListener from '../components/RealtimeListener';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'Daily Basket',
    template: '%s | Daily Basket',
  },
  description: 'Your one-stop shop for everything you need',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo192.png',
    apple: '/logo192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Daily Basket',
  },
  openGraph: {
    type: 'website',
    siteName: 'Daily Basket',
    title: 'Daily Basket',
    description: 'Your one-stop shop for everything you need',
  },
};


async function getSettings() {
  try {
    // using absolute URL for server-side fetch
    const apiUrl = process.env.API_URL || 'http://127.0.0.1:4000';
    const res = await fetch(`${apiUrl}/settings/public`, { 
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000)
    });
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
  } as React.CSSProperties;

  return (
    <html lang="en" className={`${geist.variable} h-full`} style={themeStyles} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-gray-50 pb-14 sm:pb-0">
        <LocationProvider>
          <SplashLoader />
          <NotificationBar />
          {children}
          <Footer />
          <MobileBottomNav />
          <GlobalLocationPrompt />
          <RealtimeListener />
        </LocationProvider>
      </body>
    </html>
  );
}
