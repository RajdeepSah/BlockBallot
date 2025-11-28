import type { Metadata } from 'next';
import Providers from './providers';
import '@/index.css';

export const metadata: Metadata = {
  title: 'BlockBallot - Secure Web Voting',
  description: 'Secure web voting platform',
};

/**
 * Root layout component for the Next.js application.
 * Provides the HTML structure and wraps all pages with providers.
 *
 * @param props - Layout props
 * @param props.children - Child pages/components to render
 * @returns Root HTML layout with providers
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
