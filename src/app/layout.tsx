import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Chat App',
  description: 'A modern AI chat application with conversation management and customizable settings',
  keywords: ['AI', 'Chat', 'Assistant', 'OpenRouter', 'Claude', 'GPT'],
  authors: [{ name: 'AI Chat App' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50 antialiased">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}