import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard B2B",
  description: "Visualização de movimentação B2B — Bling v3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Link
          href="/admin"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: '#C8FF00',
            color: '#000',
            fontWeight: 700,
            fontSize: '0.75rem',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            textDecoration: 'none',
            zIndex: 9999,
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
          }}
        >
          ADMIN →
        </Link>
      </body>
    </html>
  );
}
