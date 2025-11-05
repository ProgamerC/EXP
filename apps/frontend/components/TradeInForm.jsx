"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n.jsx";
import { validateAll } from "@/utils/validation";

export default function TradeInForm() {
  const { t, lang } = useI18n();

  // helper simplu de localizare (tu deja îl folosești)
  function L(ruText, roText) {
    return lang === "ro" ? roText : ruText;
  }

  // поля формы (controlled inputs)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [carMakeModel, setCarMakeModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [carMileage, setCarMileage] = useState("");
  const [notes, setNotes] = useState("");

  // honeypot антиспам
  const [honey, setHoney] = useState("");

  // служебные статусы
  // idle | sending | ok | error | invalid
  const [status, setStatus] = useState("idle");

  // ошибки по полям
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    // 1. rulează validarea locală
    const { ok, errors: newErrors, cleaned } = validateAll(
      {
        name,
        phone,
        carMakeModel,
        carYear,
        carMileage,
        notes,
        honey,
      },
      "tradein"
    );

    if (!ok) {
      // avem erori → afișăm și nu trimitem la server
      setErrors(newErrors);
      setStatus("invalid");
      return;
    }

    // dacă totul e OK:
    setErrors({});
    setStatus("sending");

    try {
      // trimitem DOAR cleaned (deja curățat / fără html / fără linkuri spam)
      const res = await fetch("/api/trade-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleaned),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        console.error("Submit fail:", data);
        setStatus("error");
        return;
      }

      // succes
      setStatus("ok");

      // resetăm toate câmpurile
      setName("");
      setPhone("");
      setCarMakeModel("");
      setCarYear("");
      setCarMileage("");
      setNotes("");
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

  const errorText = "mt-1 text-[11px] text-red-400 font-medium leading-snug";

  return (
    <form
      onSubmit={handleSubmit}
      className="
        max-w-xl mx-auto space-y-4
        rounded-2xl border border-white/10 bg-white/5 p-6
        text-white shadow-2xl backdrop-blur
      "
    >
      <h1 className="text-2xl font-bold text-white">
        {L("Обмен / Trade-In", "Trade-In / Schimb")}
      </h1>

      <p className="text-sm text-white/70">
        {L(
          "Оставьте контакты и данные машины, и мы быстро свяжемся с вами.",
          "Lasă datele de contact și mașina ta, revenim rapid."
        )}
      </p>

      {/* honeypot скрытое поле - для ботов */}
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
            {lang === "ro" ? "Introduceți un nume corect" : "Введите корректное имя"}
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

      {/* Машина клиента */}
      <div className="flex flex-col text-[13px]">
        <label className="mb-1 text-white/70 font-medium">
          {L("Ваш автомобиль", "Mașina dvs")}
        </label>
        <input
          className={`
            ${inputBase}
            border-white/30 ring-white/10
          `}
          value={carMakeModel}
          onChange={(e) => setCarMakeModel(e.target.value)}
          placeholder={L(
            "Марка, модель (например BMW X5)",
            "Marcă, model (ex. BMW X5)"
          )}
        />
        {errors.carMakeModel && (
          <div className={errorText}>
            {lang === "ro"
              ? "Completați marca și modelul"
              : "Укажите марку и модель"}
          </div>
        )}
      </div>

      {/* Год выпуска */}
      <div className="flex flex-col text-[13px]">
        <label className="mb-1 text-white/70 font-medium">
          {L("Год выпуска", "An fabricație")}
        </label>
        <input
          className={`
            ${inputBase}
            border-white/30 ring-white/10
          `}
          value={carYear}
          onChange={(e) => setCarYear(e.target.value)}
          placeholder="2018"
          inputMode="numeric"
        />
        {errors.carYear && (
          <div className={errorText}>
            {lang === "ro" ? "An nerealist" : "Нереалистичный год"}
          </div>
        )}
      </div>

      {/* Пробег */}
      <div className="flex flex-col text-[13px]">
        <label className="mb-1 text-white/70 font-medium">
          {L("Пробег (км)", "Kilometraj (km)")}
        </label>
        <input
          className={`
            ${inputBase}
            border-white/30 ring-white/10
          `}
          value={carMileage}
          onChange={(e) => setCarMileage(e.target.value)}
          placeholder="120000"
          inputMode="numeric"
        />
        {errors.carMileage && (
          <div className={errorText}>
            {lang === "ro"
              ? "Kilometraj nerealist"
              : "Нереалистичный пробег"}
          </div>
        )}
      </div>

      {/* Комментарий */}
      <div className="flex flex-col text-[13px]">
        <label className="mb-1 text-white/70 font-medium">
          {L("Комментарий", "Comentariu")}
        </label>
        <textarea
          className={`
            min-h-[70px]
            ${inputBase}
            border-white/30 ring-white/10
          `}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={L(
            "Ссылка с 999 или другая информация...",
            "Link-ul de pe 999 sau alte detalii..."
          )}
          maxLength={500}
        />
        {errors.notes && (
          <div className={errorText}>
            {lang === "ro"
              ? "Conținut interzis / prea lung"
              : "Недопустимый текст / слишком длинно"}
          </div>
        )}
      </div>

      {/* submit */}
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

      {/* статус юзеру */}
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
            "Проверьте поля, есть ошибки ⛔",
            "Verificați câmpurile marcate ⛔"
          )}
        </div>
      )}
    </form>
  );
}
