import type { Metadata } from "next";
import Providers from "./providers";
import "@/index.css";

export const metadata: Metadata = {
  title: "BlockBallot - Secure Web Voting",
  description: "Secure web voting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

