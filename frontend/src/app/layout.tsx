import type { Metadata } from 'next';
import './globals.css';
import GoogleMapProvider from '@/components/GoogleMapProvider';

export const metadata: Metadata = {
  title: 'NoidaHomes — Map-First Real Estate Listings in Noida',
  description: 'Explore curated residential and commercial properties in Noida with an interactive, real-time map.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GoogleMapProvider>{children}</GoogleMapProvider>
      </body>
    </html>
  );
}
