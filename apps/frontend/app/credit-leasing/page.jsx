import CreditLeasingForm from "@/components/CreditLeasingForm";

export const metadata = {
  title: "Credit & Leasing | ExpertAuto",
  description:
    "",
};

export default function CreditLeasingPage() {
  return (
    <main className="mx-auto max-w-4xl p-4 text-white pt-[80px] lg:pt-[100px]">
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight lg:text-[32px]">
          Credit & Leasing
        </h1>

        <p className="mt-2 text-sm text-white/70 max-w-xl mx-auto">
          Vrei mașină în credit sau leasing? Se rezolvă! / Хочешь машину в кредит или лизинг? Сделаем!
        </p>
      </div>

      <CreditLeasingForm />
    </main>
  );
}
