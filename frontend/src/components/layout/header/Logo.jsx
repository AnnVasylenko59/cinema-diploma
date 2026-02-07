import React from "react";
import { useTranslation } from "react-i18next";

export const Logo = ({ onClick }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-3 cursor-pointer group flex-shrink-0" onClick={onClick}>
            <div className="h-10 w-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-105 transition-all">
                K
            </div>
            <div className="hidden sm:block">
                <div className="font-black text-sm uppercase tracking-tighter text-gray-900 leading-none">
                    {t('header.title')}
                </div>
                <div className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest mt-1">
                    {t('header.subtitle')}
                </div>
            </div>
        </div>
    );
};