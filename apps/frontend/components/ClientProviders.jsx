"use client";

import { I18nProvider } from "@/lib/i18n.jsx";

export default function ClientProviders({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
}
