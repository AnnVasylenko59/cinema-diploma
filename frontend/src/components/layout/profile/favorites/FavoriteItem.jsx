import React from "react";
import { Trash2 } from "lucide-react";
import { minutesToHMM } from "../../../../utils";
import { styles } from "./FavoriteStyles";

export const FavoriteItem = ({ movie, onOpen, onRemove, t }) => (
    <div onClick={() => onOpen(movie)} className={styles.card}>
        <div className={styles.poster}>
            <img src={movie.posterUrl || movie.poster} alt={movie.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 truncate uppercase tracking-tight text-base mb-1 group-hover:text-blue-600 transition-colors">
                {movie.title}
            </h4>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                {movie.year} • {minutesToHMM(movie.durationMin)}
            </p>
        </div>
        <button
            onClick={(e) => { e.stopPropagation(); onRemove(movie.id); }}
            className={styles.removeBtn}
        >
            <Trash2 size={18} />
        </button>
    </div>
);