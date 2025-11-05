"use client";

import { useState } from "react";

export default function CreditForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(""); // желаемая сумма кредита/лизинга
  const [status, setStatus] = useState(null); // "ok" | "error" | null
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      type: "credit",
      fullName,
      phone,
      amount,
    };

    try {
      setIsSending(true);
      setStatus(null);

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
      setAmount("");
    } catch (err) {
      console.error("Credit send error:", err);
      setStatus("error");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 grid grid-cols-1 gap-4 text-[14px] text-white"
    >
      {/* Имя */}
      <div className="flex flex-col">
        <label className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-white/70">
          Имя
        </label>
        <input
          required
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="
            w-full rounded-lg border border-white/20 bg-black/40
            px-3 py-2 text-[14px] text-white outline-none
            ring-1 ring-white/10
            placeholder:text-white/30
            focus:border-white/50 focus:ring-white/30
          "
          placeholder="Как к вам обращаться?"
        />
      </div>

      {/* Телефон */}
      <div className="flex flex-col">
        <label className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-white/70">
          Телефон / Viber / WhatsApp
        </label>
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="
            w-full rounded-lg border border-white/20 bg-black/40
            px-3 py-2 text-[14px] text-white outline-none
            ring-1 ring-white/10
            placeholder:text-white/30
            focus:border-white/50 focus:ring-white/30
          "
          placeholder="+373 78 777 775"
        />
      </div>

      {/* Желаемая сумма */}
      <div className="flex flex-col">
        <label className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-white/70">
          Какая сумма вас интересует (€)
        </label>
        <input
          required
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="
            w-full rounded-lg border border-white/20 bg-black/40
            px-3 py-2 text-[14px] text-white outline-none
            ring-1 ring-white/10
            placeholder:text-white/30
            focus:border-white/50 focus:ring-white/30
          "
          placeholder="Например: 10000"
        />
        <p className="mt-1 text-[12px] text-white/40 leading-snug">
          Мы подберём кредит / leasing индивидуально и свяжемся с вами.
        </p>
      </div>

      {/* Кнопка */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSending}
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
          {isSending ? "Отправляем..." : "Получить предложение"}
        </button>
      </div>

      {/* статус */}
      {status === "ok" && (
        <div className="text-center text-[13px] font-medium text-emerald-300">
          Заявка отправлена. Мы скоро свяжемся с вами 📲
        </div>
      )}

      {status === "error" && (
        <div className="text-center text-[13px] font-medium text-red-400">
          Что-то пошло не так. Попробуйте позже или позвоните нам.
        </div>
      )}
    </form>
  );
}
