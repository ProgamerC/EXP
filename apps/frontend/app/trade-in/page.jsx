// apps/frontend/app/trade-in/page.jsx
import TradeInForm from "@/components/TradeInForm";

export const metadata = {
  title: "Trade-In | ExpertAuto",
  description:
    "Schimbă-ți mașina rapid și corect la ExpertAuto / Обменяй свой авто на другой — быстро и честно в ExpertAuto",
};

export default function TradeInPage() {
  return (
    <main className="mx-auto max-w-4xl p-4 text-white pt-[80px] lg:pt-[100px]">
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight lg:text-[32px]">
          Trade-In / Schimb
        </h1>
        <p className="mt-2 text-sm text-white/70 max-w-xl mx-auto">
          Lași mașina ta — pleci cu alta. Rapid, transparent, într-o singură vizită./ Сдаёшь свою машину — уезжаешь на новой. Быстро, прозрачно, в один визит.
        </p>
      </div>

      <TradeInForm />
    </main>
  );
}
