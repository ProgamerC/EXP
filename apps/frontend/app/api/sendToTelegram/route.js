export async function POST(req) {
  try {
    const body = await req.json();
    const {
      type,
      fullName,
      name,
      phone,
      carHave,
      carWant,
      year,
      mileage,
      amount,
      extra,
      honey,
      carMakeModel,
      carYear,
      carMileage,
      notes,
    } = body || {};

    // anti-bot
    if (honey && honey.trim() !== "") {
      return Response.json({ ok: false, reason: "spam" }, { status: 400 });
    }

    const humanName = (fullName || name || "").trim();
    if (!humanName || !phone) {
      return Response.json({ ok: false, reason: "missing fields" }, { status: 400 });
    }

    // normalizăm tipul: "trade-in" / "TradeIn" -> "tradein"
    const t = String(type || "").toLowerCase().replace(/[^a-z]/g, "");

    let text = "";
    if (t === "testdrive") {
      text =
        `🚗 TEST DRIVE ЗАЯВКА\n` +
        `Имя: ${humanName}\n` +
        `Телефон: ${phone}\n` +
        (carWant ? `Автомобиль для теста: ${carWant}\n` : "");
    } else if (t === "tradein") {
      // varianta veche
      text =
        `🔄 TRADE-IN ЗАЯВКА\n` +
        `Имя: ${humanName}\n` +
        `Телефон: ${phone}\n` +
        (carHave ? `Текущее авто: ${carHave}\n` : "") +
        (year ? `Год: ${year}\n` : "") +
        (mileage ? `Пробег: ${mileage} km\n` : "") +
        (carWant ? `Интересует взамен: ${carWant}\n` : "") +
        (extra ? `Комментарий: ${extra}\n` : "");

      // varianta nouă TradeInForm
      if (!carHave && carMakeModel) {
        text =
          `🚘 Новая заявка Trade-In\n` +
          `👤 Имя: ${humanName}\n` +
          `📞 Телефон: ${phone}\n` +
          (carMakeModel ? `🚗 Авто клиента: ${carMakeModel}\n` : "") +
          (carYear ? `📅 Год: ${carYear}\n` : "") +
          (carMileage ? `🛣 Пробег: ${carMileage} km\n` : "") +
          (notes ? `📝 Комментарий: ${notes}\n` : "");
      }
    } else if (t === "credit" || t === "leasing") {
      text =
        `💶 CREDIT / LEASING\n` +
        `Имя: ${humanName}\n` +
        `Телефон: ${phone}\n` +
        (amount ? `Сумма (€): ${amount}\n` : "") +
        (notes ? `Комментарий: ${notes}\n` : "");
    } else {
      text =
        `📩 НОВАЯ ЗАЯВКА\n` +
        `Имя: ${humanName}\n` +
        `Телефон: ${phone}\n` +
        (carWant ? `Запрос авто: ${carWant}\n` : "") +
        (amount ? `Сумма (€): ${amount}\n` : "") +
        (extra ? `Комментарий: ${extra}\n` : "");
    }

    text = text.trim();

    // --- ENV & routing pe tip cu fallback ---
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatDefault =
      process.env.TELEGRAM_CHAT_ID_DEFAULT || process.env.TELEGRAM_CHAT_ID;
    const chatByType = {
      testdrive: process.env.TELEGRAM_CHAT_ID_TESTDRIVE,
      tradein: process.env.TELEGRAM_CHAT_ID_TRADEIN,
      credit: process.env.TELEGRAM_CHAT_ID_CREDIT,
      leasing: process.env.TELEGRAM_CHAT_ID_CREDIT,
    };
    const chatId = chatByType[t] || chatDefault;

    if (!token || !chatId) {
      console.error("Telegram env missing: token/chatId");
      return Response.json({ ok: false, reason: "telegram env missing" }, { status: 500 });
    }

    const parseMode = process.env.TELEGRAM_PARSE_MODE || "HTML";

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode, // implicit HTML
        disable_web_page_preview: true,
      }),
    });

    const tgText = await tgRes.text();
    if (!tgRes.ok) {
      console.error("Telegram send fail:", tgRes.status, tgText);
      return Response.json({ ok: false }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("sendToTelegram fatal:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
