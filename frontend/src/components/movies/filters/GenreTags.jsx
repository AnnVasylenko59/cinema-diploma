import React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { styles } from "./FilterStyles";

export const GenreTags = ({ items, onRemove, onClear }) => {
    const { t } = useTranslation();
    if (items.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 px-4">
            {items.map(name => (
                <span key={name} className={styles.tag}>
                    {t(`filters.genres.${name}`, name)}
                    <button onClick={() => onRemove(name)} className="p-0.5 hover:bg-white/20 rounded-lg transition-colors">
                        <X size={14} />
                    </button>
                </span>
            ))}
            <button onClick={onClear} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl uppercase tracking-widest transition-colors">
                {t('filters.reset')}
            </button>
        </div>
    );
};