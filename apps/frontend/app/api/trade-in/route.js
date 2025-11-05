// apps/frontend/app/api/trade-in/route.js

function escHTML(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      carMakeModel,
      carYear,
      carMileage,
      notes,
      honey, // honeypot anti-bot
    } = body || {};

    // 1) Anti-bot: dacă honeypot are conținut -> răspundem 200 (dar nu trimitem nimic)
    if (honey && honey.trim() !== "") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Validare minimă
    const humanName = (name || "").trim();
    const phoneStr = (phone || "").trim();
    if (!phoneStr || phoneStr.length < 5) {
      return new Response(JSON.stringify({ ok: false, error: "NO_PHONE" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3) Construim mesajul (HTML safe)
    const lines = [
      "<b>🚘 Nouă cerere Trade-In</b>",
      humanName ? `👤 <b>Im̦e:</b> ${escHTML(humanName)}` : null,
      `📞 <b>Telefon:</b> ${escHTML(phoneStr)}`,
      carMakeModel ? `🚗 <b>Auto client:</b> ${escHTML(carMakeModel)}` : null,
      carYear ? `📅 <b>An:</b> ${escHTML(carYear)}` : null,
      carMileage ? `🛣 <b>Rulaj:</b> ${escHTML(carMileage)} km` : null,
      notes ? `📝 <b>Comentariu:</b> ${escHTML(notes)}` : null,
    ].filter(Boolean);

    const text = lines.join("\n").trim();

    // 4) ENV & routing (preferă chat-ul dedicat Trade-In)
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatDefault =
      process.env.TELEGRAM_CHAT_ID_DEFAULT || process.env.TELEGRAM_CHAT_ID;
    const chatId =
      process.env.TELEGRAM_CHAT_ID_TRADEIN ||
      chatDefault;

    if (!token || !chatId) {
      console.error("[trade-in] Missing TELEGRAM_BOT_TOKEN or chat id");
      return new Response(
        JSON.stringify({ ok: false, error: "SERVER_NOT_CONFIGURED" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const parseMode = process.env.TELEGRAM_PARSE_MODE || "HTML";

    // 5) Trimitere la Telegram
    const resp = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode, // HTML by default
          disable_web_page_preview: true,
        }),
      }
    );

    const tgText = await resp.text();
    if (!resp.ok) {
      console.error("[trade-in] Telegram error:", resp.status, tgText);
      return new Response(
        JSON.stringify({ ok: false, error: "TELEGRAM_FAIL" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6) OK
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[trade-in] Fatal error:", err);
    return new Response(JSON.stringify({ ok: false, error: "FATAL" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
