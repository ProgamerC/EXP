// apps/frontend/utils/validation.js

// ------------------------------------
// liste anti-spam
// ------------------------------------
const BANNED_WORDS = [
    "viagra",
    "porno",
    "порно",
    "sex",
    "секс",
    "cryptocasino",
    "казино",
    "casino",
    "ставки",
    "ставка",
    "win money",
    "fuck",
    "bitch",
    "сука",
    "хуй",
    "пидор",
];

const LINK_REGEX =
    /(https?:\/\/|www\.|t\.me\/|wa\.me\/|whatsapp\.|@everyone|\.ru\b|\.com\b|\.md\b)/i;
// linkuri interzise în comentariu (dar permitem 999.md)
// - orice URL care NU e 999.md
// - linkuri telegram / whatsapp / wa.me etc.
const BAD_NOTE_LINK_REGEX =
    /(https?:\/\/(?!999\.md)(?!www\.999\.md)[^\s]+|t\.me\/|wa\.me\/|whatsapp\.|@everyone|\.ru\b)/i;


// ------------------------------------
// helpers comune
// ------------------------------------
export function sanitizeText(str) {
    if (!str) return "";
    return String(str)
        .replace(/<[^>]*>/g, "") // scoate orice <tag> ca <script> etc
        .replace(/\s+/g, " ")
        .trim();
}

export function hasSpamLinks(str) {
    return LINK_REGEX.test(str || "");
}

export function hasBannedWords(str) {
    if (!str) return false;
    const lowered = str.toLowerCase();
    return BANNED_WORDS.some((bad) => lowered.includes(bad));
}

// ------------------------------------
// validare nume (anti "asdasd")
// ------------------------------------
function looksLikeRealName(str) {
    if (!str) return false;

    // păstrăm doar litere latine/chirilice/diacritice RO + spații + '-'
    const lettersOnly = str.replace(
        /[^a-zA-Zа-яА-ЯăâîșțĂÂÎȘȚ\s\-]+/g,
        ""
    );

    // scoatem spații și "-" pentru analiză
    const core = lettersOnly.replace(/[\s\-]/g, "");
    const coreLower = core.toLowerCase();

    // minim 2 litere reale
    if (coreLower.length < 2) {
        return false;
    }

    // respinge "aaaaaa" / "ииииии" etc (același char >=4x)
    if (/^(.)\1{3,}$/.test(coreLower)) {
        return false;
    }

    // respinge pattern repetat mic: "asd" + "asd", "фыв" + "фыв", "qweqwe"
    const repeatPattern = /([a-zA-Zа-яА-ЯăâîșțĂÂÎȘȚ]{2,4})\1{1,}/i;
    if (repeatPattern.test(coreLower)) {
        return false;
    }

    // respinge jumătate duplicată tip "asdasd", "mariamaria"
    if (coreLower.length >= 4 && coreLower.length <= 20) {
        if (coreLower.length % 2 === 0) {
            const half = coreLower.length / 2;
            const firstHalf = coreLower.slice(0, half);
            const secondHalf = coreLower.slice(half);
            if (firstHalf === secondHalf) {
                return false;
            }
        }
    }

    // trebuie să existe litere alfabetice reale
    if (!/[a-zA-Zа-яА-ЯăâîșțĂÂÎȘȚ]/.test(coreLower)) {
        return false;
    }

    return true;
}

export function validateName(name) {
    const cleaned = sanitizeText(name);

    // doar litere RO/RU + spațiu + "-", min 2 caractere
    const NAME_REGEX = /^[a-zA-Zа-яА-ЯăâîșțĂÂÎȘȚ\s\-]{2,}$/u;
    if (!NAME_REGEX.test(cleaned)) {
        return { ok: false, error: "Введите корректное имя" };
    }

    if (!looksLikeRealName(cleaned)) {
        return { ok: false, error: "Введите корректное имя" };
    }

    if (hasSpamLinks(cleaned) || hasBannedWords(cleaned)) {
        return { ok: false, error: "Недопустимый текст" };
    }

    return { ok: true, value: cleaned };
}

// ------------------------------------
// validare telefon (doar MD strict)
// Formate permise:
//  - 0[6-7]XXXXXXX  (9 cifre total, ex 069307194)
//  - +373[6-7]XXXXXXX (ex +37369307194)
// ------------------------------------
export function validatePhone(phone) {
    if (!phone) {
        return { ok: false, error: "Телефон обязателен" };
    }

    const raw = String(phone).replace(/[^\d+]/g, "");

    const mdStrictPattern = /^(?:0[67]\d{7}|\+373[67]\d{7})$/;

    if (!mdStrictPattern.test(raw)) {
        return {
            ok: false,
            error: "Номер должен быть MD (0XXXXXXXX или +373XXXXXXXX)",
        };
    }

    return { ok: true, value: raw };
}

// ------------------------------------
// validare text scurt tip mașină ("BMW X5", "crossover până la 15000€")
// folosim și la carWant, carHave
// required=true => trebuie completat
// required=false => poate fi gol
// ------------------------------------
export function validateCarLikeField(text, required = true) {
    const cleaned = sanitizeText(text);

    if (required && (!cleaned || cleaned.length < 2)) {
        return { ok: false, error: "Заполните поле" };
    }

    if (!required && !cleaned) {
        return { ok: true, value: "" };
    }

    // litere/cifre/spațiu/.-€$
    const VALID_CAR_TEXT = /^[a-zA-Z0-9а-яА-ЯăâîșțĂÂÎȘȚ\s.\-€$]{2,}$/u;
    if (!VALID_CAR_TEXT.test(cleaned)) {
        return { ok: false, error: "Неверный формат" };
    }

    if (hasSpamLinks(cleaned) || hasBannedWords(cleaned)) {
        return { ok: false, error: "Недопустимый текст" };
    }

    return { ok: true, value: cleaned };
}

// ------------------------------------
// an fabricație (opțional la Trade-In)
// ------------------------------------
export function validateYear(year) {
    if (!year) {
        return { ok: true, value: "" };
    }

    const num = Number(String(year).replace(/[^\d]/g, ""));
    if (Number.isNaN(num)) {
        return { ok: false, error: "Неверный год" };
    }

    // range realist
    if (num < 1980 || num > 2026) {
        return { ok: false, error: "Год нереалистичный" };
    }

    return { ok: true, value: String(num) };
}

// ------------------------------------
// kilometraj (opțional), dar >500 km și <1 000 000 km
// => nu acceptăm "0 km" la trade-in
// ------------------------------------
export function validateMileage(mileage) {
    if (!mileage) {
        return { ok: true, value: "" };
    }

    const num = Number(String(mileage).replace(/[^\d]/g, ""));
    if (Number.isNaN(num)) {
        return { ok: false, error: "Неверный пробег" };
    }

    if (num < 500) {
        return { ok: false, error: "Пробег нереалистичный (<500 км)" };
    }

    if (num > 1000000) {
        return { ok: false, error: "Пробег нереалистичный (>1.000.000 км)" };
    }

    return { ok: true, value: String(num) };
}

// ------------------------------------
// notițe / descriere stare (opțională),
// blocăm linkuri, cuvinte interzise, <script>, text gen "фывфыв"
// ------------------------------------
export function validateNotes(msg) {
    const cleaned = sanitizeText(msg);

    // gol este permis
    if (!cleaned) {
        return { ok: true, value: "" };
    }

    // limită de lungime (să nu facă rant/spam uriaș)
    if (cleaned.length > 500) {
        return { ok: false, error: "Слишком много текста (макс 500)" };
    }

    // linkuri interzise (telegram, wa.me, alte site-uri random)
    // dar permitem linkuri 999.md pentru anunț
    if (BAD_NOTE_LINK_REGEX.test(cleaned)) {
        return { ok: false, error: "Недопустимый текст" };
    }

    // cuvinte urâte / porno / casino etc.
    if (hasBannedWords(cleaned)) {
        return { ok: false, error: "Недопустимый текст" };
    }

    // blocăm < > ca să nu ajungă cod/script
    if (/[<>]/.test(msg)) {
        return { ok: false, error: "Символы < > запрещены" };
    }

    // detectăm spam tastatură gen "фывфыв", "asdfasdf", "qweqwe"
    const GIBBERISH_REGEX = /([a-zA-Zа-яА-ЯăâîșțĂÂÎȘȚ]{2,4})\1{1,}/i;
    if (GIBBERISH_REGEX.test(cleaned)) {
        return { ok: false, error: "Текст выглядит как спам" };
    }

    // doar simboluri gen "!!!!????" nu e acceptat
    if (/^[\W_]+$/.test(cleaned)) {
        return { ok: false, error: "Недопустимый текст" };
    }

    return { ok: true, value: cleaned };
}


// ------------------------------------
// honeypot anti-bot
// dacă cineva a completat acest câmp ascuns -> spam
// ------------------------------------
export function validateHoney(h) {
    if (h && h.trim() !== "") {
        return {
            ok: false,
            error: "spam",
            value: h.trim(),
        };
    }
    return { ok: true, value: "" };
}

// ------------------------------------
// buget / sumă (Credit & Leasing)
// trebuie să fie număr între 1000 și 200000
// ------------------------------------
export function validateBudget(value) {
    if (value === undefined || value === null || value === "") {
        return { ok: false, error: "Укажите сумму" };
    }

    const num = Number(String(value).replace(/[^\d\.]/g, ""));
    if (Number.isNaN(num)) {
        return { ok: false, error: "Только число" };
    }

    if (num < 1000) {
        return { ok: false, error: "Слишком мало (<1000€)" };
    }
    if (num > 200000) {
        return { ok: false, error: "Слишком много (>200000€)" };
    }

    return { ok: true, value: num };
}

// ------------------------------------
// VALIDARE GLOBALĂ
// întoarce { ok, errors, cleaned }
// ------------------------------------
export function validateAll(formData, formType) {
    const errors = {};
    const cleaned = {};

    function apply(field, fn, ...args) {
        const { ok, error, value } = fn(formData[field], ...args);
        if (!ok) {
            errors[field] = error;
        }
        cleaned[field] = value;
    }

    // FORMULAR TRADE-IN (mai lung, cu mașina clientului)
    if (formType === "tradein") {
        apply("name", validateName);
        apply("phone", validatePhone);
        apply("carMakeModel", (v) => validateCarLikeField(v, true));
        apply("carYear", validateYear);
        apply("carMileage", validateMileage);
        apply("notes", validateNotes);
        apply("honey", validateHoney);
    }

    // FORMULAR CREDIT / LEASING
    if (formType === "credit") {
        apply("name", validateName);
        apply("phone", validatePhone);
        apply("amount", validateBudget);
        apply("honey", validateHoney);
    }

    // FORMULAR TEST DRIVE (varianta scurtă actuală)
    // doar nume, telefon, mașina dorită + honeypot
    if (formType === "testdrive") {
        apply("fullName", validateName); // obligatoriu
        apply("phone", validatePhone); // obligatoriu
        apply("carWant", (v) => validateCarLikeField(v, true)); // obligatoriu acum
        apply("honey", validateHoney); // anti-bot
    }

    return {
        ok: Object.keys(errors).length === 0,
        errors,
        cleaned,
    };
}