import "./globals.css";
import HeaderBar from "@/components/HeaderBar";
import FooterBar from "@/components/FooterBar";
import ClientProviders from "@/components/ClientProviders";

export const metadata = {
  title: "ExpertAuto ",
  description: "Experiența face diferența.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro" className="h-full">
      <body
        className="
          h-full min-h-screen bg-[#0a0a0a] text-white
          selection:bg-emerald-400/30 selection:text-white
          relative
        "
      >
        {/* фон с подсветкой */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none fixed inset-0
            bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18)_0%,rgba(0,0,0,0)_70%)]
            opacity-70
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none fixed inset-0 mix-blend-screen opacity-[0.07]
            [background-image:repeating-radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.4)_0px,rgba(255,255,255,0.0)_2px)]
          "
        />

        {/* ВАЖНО: провайдер языков оборачивает всё приложение */}
        <ClientProviders>
          {/* шапка */}
          <HeaderBar />

          {/* контент */}
          <main className="pt-[72px] lg:pt-[80px] relative z-10">
            {children}
          </main>

          {/* футер */}
          <FooterBar />
        </ClientProviders>
      </body>
    </html>
  );
}
