import React from "react";
import { useTranslation } from "react-i18next";

export const CatalogHeader = ({ loading, count }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
                    {t('home.catalog_title')}
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                    {t('home.catalog_subtitle')}
                </p>
            </div>

            <div className="text-[11px] font-black uppercase tracking-widest px-4 py-2 bg-white border border-slate-100 shadow-sm rounded-2xl text-slate-500">
                {loading ? t('home.updating') : t('home.found_count', { count })}
            </div>
        </div>
    );
};