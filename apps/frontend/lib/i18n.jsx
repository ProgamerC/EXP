"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import ru from "@/locales/ru";
import ro from "@/locales/ro";

const dicts = { ru, ro };

const I18nContext = createContext({
  lang: "ru",
  t: (key) => key,
  setLang: () => {},
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState("ru");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lang");
      if (saved && dicts[saved]) {
        setLangState(saved);
      }
    } catch (_) {}
  }, []);

  const setLang = useCallback((nextLang) => {
    setLangState((prev) => {
      const finalLang = dicts[nextLang] ? nextLang : prev;
      try {
        window.localStorage.setItem("lang", finalLang);
      } catch (_) {}
      return finalLang;
    });
  }, []);

  const t = useCallback(
    (key) => {
      const currentDict = dicts[lang] || {};
      return currentDict[key] ?? key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      t,
      setLang,
    }),
    [lang, t, setLang]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
