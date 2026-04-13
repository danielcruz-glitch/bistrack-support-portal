import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BisTrack Support Portal',
  description: 'Support tickets, time tracking, and invoicing for Epicor BisTrack support.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
