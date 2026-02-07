import React from "react";
import { Video, Users } from "lucide-react";

const MetaItem = ({ icon: Icon, label, value }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400 uppercase font-bold text-[10px] tracking-widest">
            <Icon size={14} /> {label}
        </div>
        <p className="text-slate-900 font-bold text-base md:text-lg leading-snug">{value}</p>
    </div>
);

export const MovieMeta = ({ movie, t }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-t border-slate-100">
        <MetaItem icon={Video} label={t('movie.director')} value={movie.director || t('movie.unknown')} />
        <MetaItem icon={Users} label={t('movie.cast')} value={movie.cast ? movie.cast.join(", ") : t('movie.cast_updating')} />
    </div>
);