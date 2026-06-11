import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "À propos de Kiwi — CRM Tenakoe par PixFeed",
  description:
    "Kiwi est le CRM Tenakoe développé par PixFeed, studio de développement web spécialisé en outils métier sur mesure.",
  robots: { index: true, follow: true },
};

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="mx-auto max-w-[720px] px-5 py-12 sm:py-16">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-200 pb-6 mb-10">
          <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            <Image src="/logo.png" alt="Kiwi" width={48} height={48} className="object-contain" />
          </div>
          <div>
            <h1 className="text-[22px] font-medium text-gray-900">
              À propos de Kiwi
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Le CRM Tenakoe</p>
          </div>
        </div>

        {/* Section Kiwi */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Qu&apos;est-ce que Kiwi&nbsp;?
          </h2>
          <p className="text-[14px] leading-relaxed text-gray-700 mb-3">
            Kiwi est l&apos;outil de gestion de la relation client (CRM)
            développé sur mesure pour Tenakoe, spécialiste de
            l&apos;accompagnement aux qualifications RGE des entreprises du
            bâtiment.
          </p>
          <p className="text-[14px] leading-relaxed text-gray-700">
            L&apos;outil permet de centraliser le suivi des prospects, dossiers
            de qualification, transmissions, rendez-vous et facturation, du
            premier contact jusqu&apos;au dépôt du dossier auprès des
            certificateurs.
          </p>
        </section>

        {/* Section Conception */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Conception &amp; développement
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div>
                <div className="text-[16px] font-medium text-gray-900">
                  PixFeed
                </div>
                <div className="text-[13px] text-gray-500">
                  Studio de développement web indépendant
                </div>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed text-gray-700 mb-5">
              Kiwi a été imaginé par <strong className="text-gray-900 font-semibold">Tenakoe</strong> et
              développé par{" "}
              <a
                href="https://pixfeed.net"
                className="text-green-600 hover:text-green-700 underline underline-offset-2"
              >
                PixFeed
              </a>
              , studio de développement web basé en Île-de-France. PixFeed
              conçoit des CRM, plateformes SaaS et outils métier sur mesure
              pour entreprises et freelances, en s&apos;appuyant sur des stacks
              modernes (Next.js, FastAPI, PostgreSQL, automatisations LLM).
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                  Site
                </div>
                <a
                  href="https://pixfeed.net"
                  className="text-[14px] text-green-600 hover:text-green-700 inline-flex items-center gap-1.5"
                >
                  pixfeed.net
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                  Contact
                </div>
                <span className="text-[14px] text-gray-700">
                  contact@pixfeed.net
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section Technologies */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Technologies
          </h2>
          <p className="text-[14px] text-gray-700 mb-3">
            Kiwi est construit avec :
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Next.js 16",
              "TypeScript",
              "Prisma",
              "PostgreSQL",
              "Tailwind CSS",
              "Node.js",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-gray-100 text-gray-700 border border-gray-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 mt-10">
          <p className="text-[12px] text-gray-400">
            © 2026 Tenakoe — Tous droits réservés
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            Imaginé par Tenakoe, développé par{" "}
            <a
              href="https://pixfeed.net"
              className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              PixFeed
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
