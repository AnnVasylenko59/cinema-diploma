import React from "react";
import { Star, Calendar, Film } from "lucide-react";
import { styles } from "./MovieStyles";

export const MoviePoster = ({ movie, t }) => (
    <div className="hidden md:block md:w-[40%] bg-slate-100 relative overflow-hidden">
        {movie.posterUrl || movie.poster ? (
            <img src={movie.posterUrl || movie.poster} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <Film size={64} strokeWidth={1} className="opacity-20 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t('movie.no_poster')}</span>
            </div>
        )}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
            <div className={`${styles.badge} bg-yellow-400 text-black`}>
                <Star size={14} fill="currentColor"/> {movie.rating || '0.0'}
            </div>
            <div className={`${styles.badge} bg-white/90 text-slate-900`}>
                <Calendar size={14} className="text-slate-400"/> {movie.year}
            </div>
        </div>
    </div>
);