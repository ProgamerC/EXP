"use client";

import { useI18n } from "@/lib/i18n.jsx";

export default function TestDriveHeader() {
  const { lang } = useI18n();

  function L(ruText, roText) {
    return lang === "ro" ? roText : ruText;
  }

  return (
    <header className="mb-6">
      <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white">
        {L("Запись на тест-драйв", "Programare test drive")}
      </h1>

      <p className="mt-2 text-sm leading-relaxed text-white/60">
        {L(
          "Укажи имя, телефон и машину, которую хочешь протестировать. Мы перезвоним и согласуем время.",
          "Spune numele, telefonul și ce mașină vrei să testezi. Te sunăm să stabilim ora."
        )}
      </p>
    </header>
  );
}
