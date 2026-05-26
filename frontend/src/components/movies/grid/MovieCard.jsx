import React from "react";
import { Film, Clock, Heart } from "lucide-react";
import { minutesToHMM } from "../../../utils";
import { cardStyles as s } from "./GridStyles";
import { Card, Badge } from "../../ui/Atoms";

/**
 * Компонент картки фільму для відображення в каталозі.
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Object} props.movie - Об'єкт із даними про фільм (назва, постер тощо).
 * @param {boolean} props.isFavorite - Статус перебування фільму у списку бажаного.
 * @param {Function} props.onOpen - Функція для відкриття детальної інформації.
 * @param {Function} props.onToggleWatchlist - Функція для зміни статусу "обране".
 * @param {Function} props.t - Функція i18next для локалізації текстів.
 * @returns {JSX.Element} Картка фільму з підтримкою взаємодії.
 */
export const MovieCard = ({ movie, isFavorite, onOpen, onToggleWatchlist, t }) => {
    return (
        <Card onClick={() => onOpen(movie)} className={`${s.container} flex flex-col h-full`}>
            {/* Постер */}
            <div className={s.posterContainer}>
                {movie.posterUrl || movie.poster ? (
                    <img src={movie.posterUrl || movie.poster} alt={movie.title} className={s.image} />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-300">
                        <Film size={48} strokeWidth={1} className="mb-3 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
                            {t('movie.no_poster')}
                        </span>
                    </div>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); onToggleWatchlist(movie.id); }}
                    className={`${s.watchlistBtn} ${isFavorite ? "bg-red-500 border-red-400 text-white shadow-red-200" : "bg-white border-slate-200 text-slate-600 hover:text-red-500"}`}
                >
                    <Heart size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
                </button>
            </div>

            {/* Інфо */}
            <div className="pt-5 px-1 flex flex-col flex-1">
                <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight truncate tracking-tight group-hover:text-blue-600 transition-colors">
                        {movie.title}
                    </h3>

                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
                        <span>{movie.year}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="flex items-center gap-1">
                            <Clock size={14} className="opacity-70" />
                            {minutesToHMM(movie.durationMin)}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        {movie.genres?.slice(0, 2).map(g => (
                            <Badge key={g.genre?.id || g} variant="primary">
                                {t(`filters.genres.${g.genre?.name || g}`)}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};