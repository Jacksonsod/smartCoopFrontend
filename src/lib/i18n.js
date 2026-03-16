import { useLanguage } from "@/context/LanguageContext";
import rw from "@/locales/rw.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import sw from "@/locales/sw.json";

const translations = { rw, en, fr, sw };

export function t(key, lang) {
  return translations[lang]?.[key] || translations["rw"]?.[key] || key;
}

export function useTranslate() {
  const { language } = useLanguage();
  return (key) => t(key, language);
}

