import TestDriveForm from "@/components/TestDriveForm";
import TestDriveHeader from "@/components/TestDriveHeader";

export const metadata = {
  title: "Test Drive | ExpertAuto",
  description:
    "Programare la test drive. Alege mașina care îți place și vino să o testezi.",
};

export default function TestDrivePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-[96px] pb-16 text-white">
      <section
        className="
          relative overflow-hidden rounded-2xl border border-white/10
          bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl
        "
      >
        {/* glow / background decor */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute -top-20 -left-32 h-64 w-64
            rounded-full bg-emerald-500/20 blur-[80px]
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute -bottom-24 -right-32 h-64 w-64
            rounded-full bg-emerald-400/10 blur-[90px]
          "
        />

        <div className="relative z-10">
          <TestDriveHeader />
          <TestDriveForm />
        </div>
      </section>
    </main>
  );
}
