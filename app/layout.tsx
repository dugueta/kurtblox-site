import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KurtBlox Store",
  description: "Loja premium de Robux",
  icons: {
    icon: "/logo-kurtblox-icon.png",
    shortcut: "/logo-kurtblox-icon.png",
    apple: "/logo-kurtblox-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
