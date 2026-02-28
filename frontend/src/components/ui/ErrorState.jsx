import React from "react";
import { AlertCircle, RefreshCw, ChevronLeft, Flag } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ErrorState = ({
                               title,
                               message,
                               icon: Icon = AlertCircle,
                               type = "default", // Може бути: 'default', '404', '500', 'network'
                               onRetry,
                               onBack,
                               onReport
                           }) => {
    const { t } = useTranslation();

    const displayTitle = title || t(`errors.${type}_title`, { defaultValue: t('errors.default_title') });
    const displayMessage = message || t(`errors.${type}_message`, { defaultValue: t('errors.default_message') });

    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500 mb-8 border border-red-100 shadow-inner">
                <Icon size={48} />
            </div>

            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                {displayTitle}
            </h2>
            <p className="text-slate-500 max-w-md mb-10 font-medium leading-relaxed">
                {displayMessage}
            </p>

            <div className="flex flex-row flex-wrap items-center justify-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex flex-row items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-full font-black text-[11px] uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:shadow-md transition-all active:scale-95 group"
                    >
                        <ChevronLeft size={18} strokeWidth={3} className="shrink-0" />
                        <span className="whitespace-nowrap">{t('errors.back')}</span>
                    </button>
                )}

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex flex-row items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-full font-black text-[11px] uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:shadow-md transition-all active:scale-95 group"
                    >
                        <RefreshCw size={18} strokeWidth={3} className="shrink-0 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="whitespace-nowrap">{t('errors.retry')}</span>
                    </button>
                )}

                {onReport && (
                    <button
                        onClick={onReport}
                        className="flex flex-row items-center justify-center gap-2 px-6 py-4 bg-red-50 border border-red-100 rounded-full font-black text-[11px] uppercase tracking-widest text-red-500 hover:text-red-700 hover:border-red-300 hover:bg-red-100 hover:shadow-md transition-all active:scale-95 group"
                    >
                        <Flag size={18} strokeWidth={3} className="shrink-0" />
                        <span className="whitespace-nowrap">{t('errors.report')}</span>
                    </button>
                )}
            </div>
        </div>
    );
};