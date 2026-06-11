import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos de Kiwi — CRM Tenakoe par PixFeed",
  description:
    "Kiwi est le CRM Tenakoe développé par PixFeed, studio de développement web spécialisé en outils métier sur mesure.",
  robots: { index: true, follow: true },
};

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-[720px] px-5 py-12 sm:py-16">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-10">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            {/* TODO: remplacer par le vrai logo Kiwi */}
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M7 15h10" /><path d="M7 11h10" /><path d="M12 20c-4.4 0-8-1.8-8-4V8c0-2.2 3.6-4 8-4s8 1.8 8 4v8c0 2.2-3.6 4-8 4z" /><path d="M12 12V4" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-medium text-slate-100">
              À propos de Kiwi
            </h1>
            <p className="text-[13px] text-slate-400 mt-0.5">Le CRM Tenakoe</p>
          </div>
        </div>

        {/* Section Kiwi */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-slate-100 mb-4">
            Qu&apos;est-ce que Kiwi ?
          </h2>
          <p className="text-[14px] leading-relaxed text-slate-300 mb-3">
            Kiwi est l&apos;outil de gestion de la relation client (CRM)
            développé sur mesure pour Tenakoe, spécialiste de
            l&apos;accompagnement aux qualifications RGE des entreprises du
            bâtiment.
          </p>
          <p className="text-[14px] leading-relaxed text-slate-300">
            L&apos;outil permet de centraliser le suivi des prospects, dossiers
            de qualification, transmissions, rendez-vous et facturation, du
            premier contact jusqu&apos;au dépôt du dossier auprès des
            certificateurs.
          </p>
        </section>

        {/* Section Conception */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-slate-100 mb-4">
            Conception &amp; développement
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div>
                <div className="text-[16px] font-medium text-slate-100">
                  PixFeed
                </div>
                <div className="text-[13px] text-slate-400">
                  Studio de développement web indépendant
                </div>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed text-slate-300 mb-5">
              Kiwi a été imaginé par <strong className="text-slate-100">Tenakoe</strong> et
              développé par{" "}
              <a
                href="https://pixfeed.net"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
              >
                PixFeed
              </a>
              , studio de développement web basé en Île-de-France. PixFeed
              conçoit des CRM, plateformes SaaS et outils métier sur mesure
              pour entreprises et freelances, en s&apos;appuyant sur des stacks
              modernes (Next.js, FastAPI, PostgreSQL, automatisations LLM).
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                  Site
                </div>
                <a
                  href="https://pixfeed.net"
                  className="text-[14px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1.5"
                >
                  pixfeed.net
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                  Contact
                </div>
                <span className="text-[14px] text-slate-300">
                  contact@pixfeed.net
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section Technologies */}
        <section className="mb-10">
          <h2 className="text-lg font-medium text-slate-100 mb-4">
            Technologies
          </h2>
          <p className="text-[14px] text-slate-300 mb-3">
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
                className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-6 mt-10">
          <p className="text-[12px] text-slate-500">
            © 2026 Tenakoe — Tous droits réservés
          </p>
          <p className="text-[12px] text-slate-500 mt-1">
            Imaginé par Tenakoe, développé par{" "}
            <a
              href="https://pixfeed.net"
              className="text-slate-400 hover:text-slate-300 underline underline-offset-2"
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
