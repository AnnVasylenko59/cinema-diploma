import React from "react";
import { Film, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { classNames } from "/src/utils";

export const Navigation = ({ step, setStep }) => {
    const { t } = useTranslation();

    const navItems = [
        { id: 'home', label: t('header.nav.home'), icon: Film },
        { id: 'theaters', label: t('header.nav.theaters'), icon: MapPin },
    ];

    return (
        <nav className="hidden md:flex items-center justify-center gap-1 bg-gray-200/40 p-1 rounded-[1.25rem] border border-gray-100/20">
            {navItems.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setStep(id)}
                    className={classNames(
                        "flex items-center gap-2 px-6 py-2 rounded-[1rem] text-sm font-bold transition-all",
                        step === id ? "bg-white text-blue-600 shadow-md" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    <Icon size={16} /> {label}
                </button>
            ))}
        </nav>
    );
};