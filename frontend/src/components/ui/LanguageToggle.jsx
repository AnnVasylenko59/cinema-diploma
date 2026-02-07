import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export const LanguageToggle = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === "uk" ? "en" : "uk";
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 shadow-sm"
        >
            <Globe size={13} className="text-blue-500" />
            <span>{i18n.language === "uk" ? "EN" : "UA"}</span>
        </button>
    );
};