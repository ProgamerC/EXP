"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n.jsx";

/* === Цветные иконки соцсетей === */

function IconInstagramColor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient
          id="igGradientHeader"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="30%" stopColor="#DD2A7B" />
          <stop offset="60%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <path
        fill="url(#igGradientHeader)"
        d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .4 1.5.9.5.5.8.9.9 1.5.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.4 1-.9 1.5-.5.5-.9.8-1.5.9-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.4-1.5-.9-.5-.5-.8-.9-.9-1.5-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.4-1 .9-1.5.5-.5.9-.8 1.5-.9.5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2zm0 2.1c-3.1 0-3.5 0-4.8.1-1 .1-1.6.2-1.9.3-.5.1-.8.3-1.1.6-.3.3-.5.6-.6 1.1-.1.3-.2.9-.3 1.9-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 1 .2 1.6.3 1.9.1.5.3.8.6 1.1.3.3.6.5 1.1.6.3.1.9.2 1.9.3 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c1-.1 1.6-.2 1.9-.3.5-.1.8-.3 1.1-.6.3-.3.5-.6.6-1.1.1-.3.2-.9.3-1.9.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-1-.2-1.6-.3-1.9-.1-.5-.3-.8-.6-1.1-.3-.3-.6-.5-1.1-.6-.3-.1-.9-.2-1.9-.3-1.2-.1-1.6-.1-4.8-.1zm0 2.8a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 2.1a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm5-1.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"
      />
    </svg>
  );
}

function IconTelegramColor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#259CD8"
        d="M9.8 15.6 9.6 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.2.2 1.4-.6l2.6-12.1c.2-.9-.3-1.3-1-.9L3.5 10.2c-.8.3-.8.8-.1 1l4.7 1.4 10.8-6.8c.5-.3 1-.1.6.2L9.8 15.6z"
      />
    </svg>
  );
}

function IconFacebookColor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M22 12.1C22 6.5 17.5 2 11.9 2S2 6.5 2 12.1C2 17 5.6 21.1 10.3 22v-7H7.7v-2.9h2.6V9.5c0-2.6 1.6-4 3.9-4 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6v2h2.8l-.4 2.9h-2.4v7C18.4 21.1 22 17 22 12.1z"
      />
    </svg>
  );
}

function IconTikTokColor() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#25F4EE"
        d="M33.6 14.2c2.3 1.8 5.2 2.9 8.3 2.9v6.5a16.8 16.8 0 0 1-9.8-3.2v11.3a10.7 10.7 0 1 1-10.7-10.7c.5 0 1 .1 1.5.1v7.6c-.5-.1-1-.2-1.5-.2a3.9 3.9 0 1 0 3.9 3.9V6.7h6.8v7.5z"
      />
      <path
        fill="#000000"
        d="M32.1 13.4c2.4 2 5.5 3.2 8.9 3.2v7.3c-3.7 0-7.2-1.1-10.1-3v12c0 5.9-4.8 10.7-10.7 10.7S9.5 39 9.5 33.1 14.3 22.4 20.2 22.4c.5 0 1 .1 1.5.1v7.6c-.5-.1-1-.2-1.5-.2a3.9 3.9 0 1 0 3.9 3.9V6.7h7.9v6.7z"
      />
      <path
        fill="#FE2C55"
        d="M33.6 14.2v2.2c-2.9-1.1-5.4-3.1-6.8-5.7v18.3a10.7 10.7 0 1 1-10.7-10.7c.5 0 1 .1 1.5.1v3.1c-.5-.1-1-.2-1.5-.2a7.5 7.5 0 1 0 7.5 7.5V6.7h3.7c1.3 3.1 3.6 5.7 6.3 7.5z"
      />
    </svg>
  );
}




function IconWhatsAppColor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#25D366"
        d="M12 2a9 9 0 0 0-7.7 13.7L3 22l6.5-1.3A9 9 0 1 0 12 2z"
      />
      <path
        fill="#ffffff"
        d="M8.5 9.5c0 3 4 5.5 4.5 5.5.5 0 1.5-.5 2-.5s1 .5 1.5 1c.5.5.5.8.5 1.2 0 .3-.2.5-.4.7-.4.4-1.2.8-2 .8-1.7 0-5.6-2.2-6.7-5.6C7.5 10.7 7.5 10 8 9.4c.2-.3.6-.4 1-.4.4 0 .5 0 .7.1.2.1.4.5.4.5z"
      />
    </svg>
  );
}

/* ========== ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА ========== */

function LanguageSwitch({ className = "" }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={
        "flex items-center gap-2 text-[12px] font-semibold text-white/70 " +
        className
      }
    >
      <button
        onClick={() => setLang("ru")}
        className={
          "px-2 py-1 rounded-md transition " +
          (lang === "ru"
            ? "bg-white text-black shadow-[0_12px_32px_rgba(255,255,255,0.3)]"
            : "bg-white/0 text-white/70 ring-1 ring-white/20 hover:text-white hover:bg-white/10")
        }
      >
        RU
      </button>

      <button
        onClick={() => setLang("ro")}
        className={
          "px-2 py-1 rounded-md transition " +
          (lang === "ro"
            ? "bg-white text-black shadow-[0_12px_32px_rgba(255,255,255,0.3)]"
            : "bg-white/0 text-white/70 ring-1 ring-white/20 hover:text-white hover:bg-white/10")
        }
      >
        RO
      </button>
    </div>
  );
}

/* === HEADER BAR === */

export default function HeaderBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div
        className="
          border-b border-white/10
          bg-[rgba(0,0,0,0.6)]
          backdrop-blur-xl
          shadow-[0_20px_40px_rgba(0,0,0,0.8)]
        "
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:py-4">
          {/* ЛЕВО: логотип + слоган */}
          <div className="flex items-center gap-3">
            <Link href="/cars" className="flex items-center gap-3 text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="ExpertAuto"
                className="h-12 w-auto object-contain"
              />

              <span className="hidden flex-col leading-tight text-white lg:flex">
                <span className="text-[13px] font-semibold uppercase tracking-wide text-white/90">
                  Experiența face diferența!
                </span>
              </span>
            </Link>
          </div>

          {/* ЦЕНТР (desktop меню) */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 lg:flex">
            <Link href="/cars" className="transition hover:text-white">
              {t("nav.catalog")}
            </Link>

            <Link href="/trade-in" className="transition hover:text-white">
              {t("nav.tradeIn")}
            </Link>

            <Link
              href="/credit-leasing"
              className="transition hover:text-white"
            >
              {t("nav.credit")}
            </Link>

            <Link href="/test-drive" className="transition hover:text-white">
              {t("nav.testDrive")}
            </Link>
          </nav>

          {/* ПРАВО: соцсети + звонок + переключатель языка */}
          <div className="hidden items-center lg:flex">
            {/* соцсети */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/expert_auto.md/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group inline-flex h-9 w-9 items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105 bg-black/30"
                title="Instagram"
              >
                <IconInstagramColor />
              </a>

              <a
                href="https://t.me/expertauto_md"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="group inline-flex h-9 w-9 items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105 bg-black/30"
                title="Telegram"
              >
                <IconTelegramColor />
              </a>

              <a
                href="https://www.facebook.com/ExpertAuto.md"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="group inline-flex h-9 w-9 items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105 bg-black/30"
                title="Facebook"
              >
                <IconFacebookColor />
              </a>

              


              

              <a
                href="https://wa.me/37378777775"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="group inline-flex h-9 w-9 items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105 bg-black/30"
                title="WhatsApp +37378777775"
              >
                <IconWhatsAppColor />
              </a>

              <a
                href="https://www.tiktok.com/@expertautomd1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="group inline-flex h-9 w-9 items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105 bg-black/30"
                title="TikTok"
              >
                <IconTikTokColor />
              </a>

              {/* CTA звонка */}
              <a
                href="tel:+37378777775"
                className="
                  ml-2
                  inline-flex items-center gap-2
                  whitespace-nowrap
                  rounded-xl bg-white text-black text-[12px] font-semibold
                  px-3 py-2
                  shadow-[0_12px_32px_rgba(255,255,255,0.2)]
                  ring-1 ring-white/30
                  hover:opacity-90 hover:shadow-[0_16px_40px_rgba(255,255,255,0.3)]
                  transition
                "
              >
                <span className="leading-none">Sună acum!</span>
                <span className="leading-none hidden xl:inline">
                  +373 78 777 775
                </span>
              </a>
            </div>

            {/* переключатель языка - САМЫЙ ПРАВЫЙ */}
            <div className="ml-4 pl-4 border-l border-white/20">
              <LanguageSwitch />
            </div>
          </div>

          {/* МОБИЛЬНАЯ ПАНЕЛЬ СПРАВА */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Быстрый звонок */}
            <a
              href="tel:+37378777775"
              className="
                rounded-lg bg-white text-black text-[12px] font-semibold
                px-2 py-1.5
                shadow-[0_8px_24px_rgba(255,255,255,0.25)]
                ring-1 ring-white/30
                hover:opacity-90
              "
            >
              Sună!
            </a>

            {/* бургер */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="
                flex h-9 w-9 items-center justify-center rounded-lg
                bg-white/5 text-white/80 ring-1 ring-white/15
                hover:bg-white/10 hover:text-white
              "
              aria-label="Menú"
            >
              ⋮
            </button>
          </div>
        </div>
      </div>

      {/* мобильное выпадающее меню */}
      {menuOpen && (
        <div
          className="
            absolute right-2 top-[64px] w-56 rounded-xl border border-white/10
            bg-[rgba(0,0,0,0.8)] p-3 text-[13px] text-white shadow-2xl backdrop-blur-xl
            lg:hidden
          "
        >
          <div className="flex flex-col gap-2">
            {/* ссылки навигации */}
            <Link
              href="/cars"
              className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              <span>{t("nav.catalog")}</span>
            </Link>

            <Link
              href="/trade-in"
              className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              <span>{t("nav.tradeIn")}</span>
            </Link>

            <Link
              href="/credit-leasing"
              className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              <span>{t("nav.credit")}</span>
            </Link>

            <Link
              href="/test-drive"
              className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              <span>{t("nav.testDrive")}</span>
            </Link>

            {/* переключатель языка (mobile) */}
            <div className="mt-2 border-t border-white/10 pt-2">
              <LanguageSwitch className="justify-start" />
            </div>

            {/* CTA телефон */}
            <a
              href="tel:+37378777775"
              className="
                mt-2 flex items-center justify-between rounded-lg
                bg-white text-black font-semibold text-[13px]
                px-3 py-2
                shadow-[0_12px_32px_rgba(255,255,255,0.25)]
                ring-1 ring-white/30
                hover:opacity-90
              "
            >
              <span>Sună acum!</span>
              <span className="text-[12px] font-bold whitespace-nowrap">
                +373&nbsp;78&nbsp;777&nbsp;775
              </span>
            </a>

            {/* соцсети */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
              <a
                href="https://www.instagram.com/expert_auto.md/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 hover:bg-white/10"
              >
                <IconInstagramColor />
                <span className="text-[11px] leading-none">Instagram</span>
              </a>

              <a
                href="https://t.me/expertauto_md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 hover:bg-white/10"
              >
                <IconTelegramColor />
                <span className="text-[11px] leading-none">Telegram</span>
              </a>

              <a
                href="https://www.facebook.com/ExpertAuto.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 hover:bg-white/10"
              >
                <IconFacebookColor />
                <span className="text-[11px] leading-none">Facebook</span>
              </a>

          



              <a
                href="https://wa.me/37378777775"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 hover:bg-white/10"
              >
                <IconWhatsAppColor />
                <span className="text-[11px] leading-none">WhatsApp</span>
              </a>

              <a
                href="https://www.tiktok.com/@expertautomd1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 hover:bg-white/10"
              >
                <IconTikTokColor />
                <span className="text-[11px] leading-none">TikTok</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
