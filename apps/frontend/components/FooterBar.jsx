export default function FooterBar() {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/10 bg-black/40 px-4 py-10 text-white/80 backdrop-blur-xl site-bottom">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">

        {/* Блок 1: О компании */}
        <div className="flex flex-col gap-3 text-sm leading-relaxed">
          <div className="text-white text-base font-semibold tracking-wide">
            ExpertAuto
          </div>
          <div className="text-white/60 text-[13px]">
            Import auto la comandă, finanțare pe măsura ta și consultanță sinceră.
            Tu alegi mașina, noi facem restul.
          </div>
          <div className="text-white/40 text-[12px]">
            © {new Date().getFullYear()} ExpertAuto. Toate drepturile rezervate.
          </div>
        </div>

        {/* Блок 2: Контакты + Соцсети с иконками */}
        <div className="flex flex-col gap-3 text-sm">
          <div className="text-white text-base font-semibold tracking-wide">
            Contacte
          </div>

          <div className="text-white/80 text-[13px] leading-snug">
            str. Buiucani 1A<br />
            Dumbrava (Chișinău), Moldova
          </div>

          <div className="text-white/80 text-[13px]">
            Tel / Viber / WhatsApp:{" "}
            <span className="whitespace-nowrap">+373 78 777 775</span>
          </div>

          {/* Социальные иконки */}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/expert_auto.md/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="group inline-flex items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105"
              title="Instagram"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                <defs>
                  <linearGradient id="igGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F58529" />
                    <stop offset="30%" stopColor="#DD2A7B" />
                    <stop offset="60%" stopColor="#8134AF" />
                    <stop offset="100%" stopColor="#515BD4" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#igGradient)"
                  d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .4 1.5.9.5.5.8.9.9 1.5.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.4 1-.9 1.5-.5.5-.9.8-1.5.9-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.4-1.5-.9-.5-.5-.8-.9-.9-1.5-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.4-1 .9-1.5.5-.5.9-.8 1.5-.9.5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2zm0 2.1c-3.1 0-3.5 0-4.8.1-1 .1-1.6.2-1.9.3-.5.1-.8.3-1.1.6-.3.3-.5.6-.6 1.1-.1.3-.2.9-.3 1.9-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 1 .2 1.6.3 1.9.1.5.3.8.6 1.1.3.3.6.5 1.1.6.3.1.9.2 1.9.3 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c1-.1 1.6-.2 1.9-.3.5-.1.8-.3 1.1-.6.3-.3.5-.6.6-1.1.1-.3.2-.9.3-1.9.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-1-.2-1.6-.3-1.9-.1-.5-.3-.8-.6-1.1-.3-.3-.6-.5-1.1-.6-.3-.1-.9-.2-1.9-.3-1.2-.1-1.6-.1-4.8-.1zm0 2.8a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 2.1a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm5-1.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"
                />
              </svg>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/expertauto_md"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="group inline-flex items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105"
              title="Telegram"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#259CD8"
                  d="M9.8 15.6 9.6 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.2.2 1.4-.6l2.6-12.1c.2-.9-.3-1.3-1-.9L3.5 10.2c-.8.3-.8.8-.1 1l4.7 1.4 10.8-6.8c.5-.3 1-.1.6.2L9.8 15.6z"
                />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/ExpertAuto.md"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="group inline-flex items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105"
              title="Facebook"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#1877F2"
                  d="M22 12.1C22 6.5 17.5 2 11.9 2S2 6.5 2 12.1C2 17 5.6 21.1 10.3 22v-7H7.7v-2.9h2.6V9.5c0-2.6 1.6-4 3.9-4 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6v2h2.8l-.4 2.9h-2.4v7C18.4 21.1 22 17 22 12.1z"
                />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@expertautomd1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="group inline-flex items-center justify-center rounded-full p-2 ring-1 ring-white/10 hover:ring-white/30 transition transform hover:scale-105"
              title="TikTok"
            >
              <svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#25F4EE"
                  d="M33.6 14.2c2.3 1.8 5.2 2.9 8.3 2.9v6.5a16.8 16.8 0 0 1-9.8-3.2v11.3a10.7 10.7 0 1 1-10.7-10.7c.5 0 1 .1 1.5.1v6.8a3.9 3.9 0 1 0 3.9 3.9V6.7h6.8v7.5z"
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
            </a>
          </div>
        </div>

        {/* Блок 3: Карта */}
        <div className="overflow-hidden rounded-xl ring-1 ring-white/20 shadow-lg shadow-black/50">
          <iframe
            title="ExpertAuto location"
            className="h-48 w-full"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={
              "https://www.google.com/maps?q=" +
              encodeURIComponent("str. Buiucani 1A, Dumbrava, Chișinău, Moldova") +
              "&output=embed"
            }
          />
        </div>
      </div>
    </footer>
  );
}
