import type { Metadata } from "next";
import { ReactNode } from 'react';
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { Web3Provider } from "../providers/web3";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Servel Dashboard",
  description: "Blockchain monitoring and analytics dashboard",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
        suppressHydrationWarning
      >
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
