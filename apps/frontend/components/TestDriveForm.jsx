"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n.jsx";
import { validateAll } from "@/utils/validation";

export default function TestDriveForm() {
  const { lang } = useI18n();

  // mic helper ca la celelalte forme
  function L(ruText, roText) {
    return lang === "ro" ? roText : ruText;
  }

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [carWant, setCarWant] = useState(""); // mașina cerută la test drive

  // honeypot (anti-bot)
  const [honey, setHoney] = useState("");

  // idle | sending | ok | error | invalid
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();

    // validăm doar câmpurile care mai există în forma scurtă
    const { ok, errors: newErrors, cleaned } = validateAll(
      {
        fullName,
        phone,
        carWant,
        honey,
      },
      "testdrive"
    );

    if (!ok) {
      setErrors(newErrors);
      setStatus("invalid");
      return;
    }

    setErrors({});
    setStatus("sending");

    try {
      const payload = {
        type: "testdrive",
        fullName: cleaned.fullName,
        phone: cleaned.phone,
        carWant: cleaned.carWant,
        honey: cleaned.honey,
      };

      const res = await fetch("/api/sendToTelegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("bad status " + res.status);
      }

      const data = await res.json();
      if (!data?.ok) {
        throw new Error("telegram failed");
      }

      setStatus("ok");
      setFullName("");
      setPhone("");
      setCarWant("");
      setHoney("");
    } catch (err) {
      console.error("TestDrive send error:", err);
      setStatus("error");
    }
  }

  const inputBase = `
    w-full rounded-lg border border-white/20 bg-black/40
    px-3 py-2 text-[14px] text-white outline-none
    ring-1 ring-white/10
    placeholder:text-white/30
    focus:border-white/50 focus:ring-white/30
  `;

  const labelBase = `
    mb-1 text-[12px] font-semibold uppercase tracking-wide text-white/70
  `;

  const errorText = `
    mt-1 text-[11px] font-medium leading-snug text-red-400
  `;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 grid grid-cols-1 gap-4 text-[14px] text-white"
    >
      {/* honeypot: ascuns / anti-bot */}
      <div className="hidden">
        <label className={labelBase}>
          {L("Ваш сайт", "Site-ul dvs")}
        </label>
        <input
          type="text"
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
          className={inputBase}
          placeholder="http://spam.bot"
        />
      </div>

      {/* Имя / Nume */}
      <div className="flex flex-col">
        <label className={labelBase}>
          {L("Имя", "Nume")}
        </label>
        <input
          required
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputBase}
          placeholder={L("Как к вам обращаться?", "Cum vă numiți?")}
        />
        {errors.fullName && (
          <div className={errorText}>
            {lang === "ro"
              ? "Introduceți un nume corect"
              : "Введите корректное имя"}
          </div>
        )}
      </div>

      {/* Телефон / Telefon */}
      <div className="flex flex-col">
        <label className={labelBase}>
          {L("Телефон", "Telefon")}
        </label>
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputBase}
          placeholder={L(
            "+373 78 777 775",
            "+373 78 777 775"
          )}
        />
        {errors.phone && (
          <div className={errorText}>
            {lang === "ro"
              ? "Număr invalid"
              : "Неверный номер телефона"}
          </div>
        )}
      </div>

      {/* Машина / Mașina dorită */}
      <div className="flex flex-col">
        <label className={labelBase}>
          {L(
            "Какую машину хотите протестировать",
            "Ce mașină vrei să testezi"
          )}
        </label>
        <input
          required
          type="text"
          value={carWant}
          onChange={(e) => setCarWant(e.target.value)}
          className={inputBase}
          placeholder={L(
            "Ex: Peugeot 3008 Hybrid",
            "Ex: Peugeot 3008 Hybrid"
          )}
        />
        {errors.carWant && (
          <div className={errorText}>
            {lang === "ro"
              ? "Introduceți modelul dorit"
              : "Укажите модель автомобиля"}
          </div>
        )}
      </div>

      {/* Buton */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="
            inline-flex w-full items-center justify-center gap-2 rounded-xl
            bg-emerald-500/20 px-4 py-2.5 text-center text-[14px] font-semibold
            text-emerald-300 ring-1 ring-inset ring-emerald-400/40
            shadow-[0_20px_40px_rgba(16,185,129,0.25)]
            hover:bg-emerald-500/30 hover:text-emerald-200
            disabled:opacity-50
            transition
          "
        >
          {status === "sending"
            ? L("Отправляем...", "Se trimite...")
            : L("Записаться на тест-драйв", "Programează test drive")}
        </button>
      </div>

      {/* Status mesaje */}
      {status === "ok" && (
        <div className="text-center text-[13px] font-medium text-emerald-300">
          {L(
            "Заявка отправлена. Мы скоро свяжемся с вами 📲",
            "Cererea a fost trimisă. Te sunăm 📲"
          )}
        </div>
      )}

      {status === "error" && (
        <div className="text-center text-[13px] font-medium text-red-400">
          {L(
            "Что-то пошло не так. Попробуйте позже или позвоните нам.",
            "Ceva nu a mers. Sună-ne direct, te rog."
          )}
        </div>
      )}

      {status === "invalid" && (
        <div className="text-center text-[13px] font-medium text-red-400">
          {L(
            "Проверьте поля — там есть ошибки ⛔",
            "Verifică câmpurile — sunt erori ⛔"
          )}
        </div>
      )}
    </form>
  );
}
