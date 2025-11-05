"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n.jsx";

export default function RequestForm({ type }) {
  // type = "trade-in" или "credit"
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // эти поля нужны для trade-in
  const [carInfo, setCarInfo] = useState(""); // марка/модель твоей машины
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");

  // это поле нужно для кредит/лизинг
  const [desired, setDesired] = useState(""); // "хочу SUV до 250€/lună"

  const [status, setStatus] = useState(null); // null | "loading" | "ok" | "error"

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    // это то, что мы отправим на backend
    const payload = {
      source: type, // чтобы ты в админке видел откуда заявка
      name,
      phone,
    };

    if (type === "trade-in") {
      payload.carInfo = carInfo;
      payload.year = year;
      payload.mileage = mileage;
    }

    if (type === "credit") {
      payload.desired = desired;
    }

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/leads/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Bad response");

      // успех
      setStatus("ok");
      setName("");
      setPhone("");
      setCarInfo("");
      setYear("");
      setMileage("");
      setDesired("");
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        w-full max-w-xl space-y-4
        rounded-xl border border-white/10 bg-white/[0.03] p-4
        ring-1 ring-white/5 backdrop-blur-xl text-[14px]
      "
    >
      {/* Имя */}
      <div className="flex flex-col gap-1">
        <label className="text-white/80 text-[12px] font-medium">{t("forms.name")}</label>
        <input
          className="
            w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-[13px] text-white
            placeholder-white/30 outline-none
            focus:ring-2 focus:ring-emerald-400/40
          "
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Телефон */}
      <div className="flex flex-col gap-1">
        <label className="text-white/80 text-[12px] font-medium">{t("forms.phone")}</label>
        <input
          className="
            w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-[13px] text-white
            placeholder-white/30 outline-none
            focus:ring-2 focus:ring-emerald-400/40
          "
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      {type === "trade-in" && (
        <>
          {/* Какая машина сдаётся */}
          <div className="flex flex-col gap-1">
            <label className="text-white/80 text-[12px] font-medium">{t("forms.car")}</label>
            <input
              className="
                w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-[13px] text-white
                placeholder-white/30 outline-none
                focus:ring-2 focus:ring-emerald-400/40
              "
              value={carInfo}
              onChange={(e) => setCarInfo(e.target.value)}
              placeholder="VW Passat 2.0 TDI"
              required
            />
          </div>

          {/* Год и пробег */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-white/80 text-[12px] font-medium">{t("forms.year")}</label>
              <input
                className="
                  w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-[13px] text-white
                  placeholder-white/30 outline-none
                  focus:ring-2 focus:ring-emerald-400/40
                "
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2017"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white/80 text-[12px] font-medium">{t("forms.mileage")}</label>
              <input
                className="
                  w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-[13px] text-white
                  placeholder-white/30 outline-none
                  focus:ring-2 focus:ring-emerald-400/40
                "
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="145000 km"
                required
              />
            </div>
          </div>
        </>
      )}

      {type === "credit" && (
        <div className="flex flex-col gap-1">
          <label className="text-white/80 text-[12px] font-medium">
            {t("forms.desiredCar")}
          </label>
          <textarea
            className="
              w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-[13px] text-white
              placeholder-white/30 outline-none
              focus:ring-2 focus:ring-emerald-400/40
            "
            rows={3}
            value={desired}
            onChange={(e) => setDesired(e.target.value)}
            placeholder="SUV până la 250€/lună / Vreau Passat, buget 10k"
            required
          />
        </div>
      )}

      <button
        type="submit"
        className="
          w-full rounded-xl bg-emerald-400 text-black text-[13px] font-semibold
          px-4 py-2
          shadow-[0_20px_60px_rgba(16,185,129,0.4)]
          ring-1 ring-emerald-300/50
          hover:bg-emerald-300 hover:shadow-[0_28px_80px_rgba(16,185,129,0.55)]
          active:scale-[.99] transition
        "
        disabled={status === "loading"}
      >
        {t("forms.submit")}
      </button>

      {status === "ok" && (
        <p className="text-[12px] text-emerald-400">
          ✔️ Trimis / Отправлено. Te sunăm / Мы свяжемся.
        </p>
      )}

      {status === "error" && (
        <p className="text-[12px] text-red-400">
          ❌ A apărut o problemă. Încearcă din nou sau sună-ne.
        </p>
      )}
    </form>
  );
}
