"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n.jsx";
import { validateAll } from "@/utils/validation";

export default function CreditLeasingForm() {
  const { lang } = useI18n();

  function L(ruText, roText) {
    return lang === "ro" ? roText : ruText;
  }

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  // honeypot антибот
  const [honey, setHoney] = useState("");

  // idle | sending | ok | error | invalid
  const [status, setStatus] = useState("idle");

  // ошибки по полям
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    // 1. ВАЛИДАЦИЯ ПЕРЕД ОТПРАВКОЙ
    const { ok, errors: newErrors, cleaned } = validateAll(
      { name, phone, amount, honey },
      "credit"
    );

    if (!ok) {
      setErrors(newErrors);
      setStatus("invalid");
      return;
    }

    // valid -> отправляем
    setErrors({});
    setStatus("sending");

    try {
      const res = await fetch("/api/credit-leasing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // trimitem doar cleaned (curat, fără linkuri, fără prostii)
        body: JSON.stringify(cleaned),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        console.error("Submit fail:", data);
        setStatus("error");
        return;
      }

      setStatus("ok");
      setName("");
      setPhone("");
      setAmount("");
      setHoney("");
    } catch (err) {
      console.error("Submit fatal:", err);
      setStatus("error");
    }
  }

  const inputBase = `
    rounded-lg border px-3 py-2 text-[13px]
    text-white outline-none ring-1
    bg-black/80
    focus:border-white/60 focus:ring-white/30
  `;

  const errorText = `
    mt-1 text-[11px] font-medium leading-snug text-red-400
  `;

  return (
    <form
      onSubmit={handleSubmit}
      className="
        space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6
        text-white shadow-2xl backdrop-blur
        max-w-xl mx-auto
      "
    >
      <h1 className="text-2xl font-bold text-white">
        {L("Кредит & Лизинг", "Credit & Leasing")}
      </h1>

      <p className="text-sm text-white/70">
        {L(
          "Оставьте контакт и сумму, которая вам нужна. Мы перезвоним и подберём лучшее предложение.",
          "Lasă contactul și suma dorită. Te sunăm și îți găsim cea mai bună ofertă."
        )}
      </p>

      {/* honeypot антибот */}
      <div className="hidden">
        <label className="text-[13px] text-white/70 font-medium">
          {L("Ваш сайт", "Site-ul dvs")}
        </label>
        <input
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
          className="border"
          placeholder="http://spam.bot"
        />
      </div>

      {/* Имя */}
      <div className="flex flex-col text-[13px]">
        <label className="mb-1 text-white/70 font-medium">
          {L("Имя", "Nume")}
        </label>
        <input
          className={`
            ${inputBase}
            border-white/30 ring-white/10
          `}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L("Как к вам обращаться?", "Cum vă numiți?")}
        />
        {errors.name && (
          <div className={errorText}>
            {lang === "ro"
              ? "Introduceți un nume corect"
              : "Введите корректное имя"}
          </div>
        )}
      </div>

      {/* Телефон */}
      <div className="flex flex-col text-[13px]">
        <label className="mb-1 text-white/70 font-medium">
          {L("Телефон *", "Telefon *")}
        </label>
        <input
          className={`
            ${inputBase}
            border-emerald-400/40 ring-emerald-400/30
            focus:border-emerald-300/60 focus:ring-emerald-300/30
            placeholder:text-white/30
          `}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+373 78 777 775"
          required
        />
        {errors.phone && (
          <div className={errorText}>
            {lang === "ro" ? "Telefon invalid" : "Неверный номер телефона"}
          </div>
        )}
      </div>

      {/* Сумма */}
      <div className="flex flex-col text-[13px]">
        <label className="mb-1 text-white/70 font-medium">
          {L("Желаемая сумма (€)", "Suma dorită (€)")}
        </label>
        <input
          className={`
            ${inputBase}
            border-white/30 ring-white/10
          `}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={L("Например 8000", "Exemplu 8000")}
          inputMode="numeric"
        />
        {errors.amount && (
          <div className={errorText}>
            {lang === "ro"
              ? "Introduceți suma (1000-200000€)"
              : "Сумма (1000-200000€)"}
          </div>
        )}
      </div>

      {/* Кнопка */}
      <button
        disabled={status === "sending"}
        className="
          w-full rounded-xl bg-emerald-400 text-black text-[14px] font-semibold
          px-4 py-3
          shadow-[0_16px_40px_rgba(16,185,129,0.4)]
          ring-1 ring-emerald-300/50
          hover:bg-emerald-300 hover:shadow-[0_20px_60px_rgba(16,185,129,0.5)]
          active:scale-[.99] transition disabled:opacity-50
        "
      >
        {status === "sending"
          ? L("Отправляем...", "Se trimite...")
          : L("Отправить заявку", "Trimite cererea")}
      </button>

      {/* Статус */}
      {status === "ok" && (
        <div className="text-center text-[13px] font-medium text-emerald-400">
          {L(
            "Готово! Мы скоро свяжемся ✅",
            "Perfect! Revenim foarte rapid ✅"
          )}
        </div>
      )}

      {status === "error" && (
        <div className="text-center text-[13px] font-medium text-red-400">
          {L(
            "Ошибка отправки. Позвоните нам, пожалуйста 🙏",
            "Eroare la trimitere. Sunați-ne direct 🙏"
          )}
        </div>
      )}

      {status === "invalid" && (
        <div className="text-center text-[13px] font-medium text-red-400">
          {L(
            "Проверьте поля — там есть ошибки ⛔",
            "Verificați câmpurile marcate ⛔"
          )}
        </div>
      )}
    </form>
  );
}
