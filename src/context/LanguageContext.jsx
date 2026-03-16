import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const supportedLanguages = [
  { code: "rw", label: "Kinyarwanda" },
  { code: "sw", label: "Kiswahili" },
  { code: "fr", label: "French" },
  { code: "en", label: "English" },
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("rw"); // default Kinyarwanda

  useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored && supportedLanguages.some(l => l.code === stored)) {
      setLanguage(stored);
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
