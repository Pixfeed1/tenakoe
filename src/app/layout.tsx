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
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var dark = localStorage.getItem('tenakoe-dark') === 'true';
              if (dark) {
                document.documentElement.style.background = '#0f1117';
                document.documentElement.style.color = '#f1f5f9';
              } else {
                document.documentElement.style.background = '#f8f9fb';
                document.documentElement.style.color = '#0f172a';
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="antialiased" style={{ transition: "background 0.3s, color 0.3s" }}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
