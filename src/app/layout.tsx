import type { Metadata } from "next";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenakoe CRM",
  description: "CRM de qualification RGE — Tenakoe",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var d = localStorage.getItem('tenakoe-dark') === 'true';
            document.documentElement.style.background = d ? '#0f1117' : '#f8f9fb';
            document.documentElement.style.color = d ? '#f1f5f9' : '#0f172a';
          } catch(e) {}
        `}} />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
