import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthLayout from "@/components/AuthLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pace-it Health",
  description: "Acompanhamento de saúde e bem-estar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  );
}
