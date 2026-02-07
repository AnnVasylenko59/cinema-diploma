import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlayCircle, Clock, Heart, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { minutesToHMM } from "../../../utils";
import { Button } from "../../ui/Atoms";
import { styles } from "./MovieStyles";
import { MoviePoster } from "./MoviePoster";
import { MovieMeta } from "./MovieMeta";

export const MovieModal = ({ movie, onClose, onFindTheaters, isFavorite, onToggleWatchlist }) => {
    const { t } = useTranslation();
    if (!movie) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.overlay} onClick={onClose}>
                <motion.div initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }} className={styles.modal} onClick={e => e.stopPropagation()}>

                    <MoviePoster movie={movie} t={t} />

                    <div className="w-full md:w-[60%] p-8 md:p-12 flex flex-col bg-white h-full">
                        <div className="flex justify-between items-start gap-6 mb-6">
                            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 uppercase tracking-tight">{movie.title}</h3>
                            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 custom-inner-scrollbar">
                            <div className="flex flex-wrap items-center gap-2 mb-8">
                                {movie.genres?.map(g => (
                                    <span key={g.genre?.id || g} className={styles.genreTag}>{t(`filters.genres.${g.genre?.name || g}`)}</span>
                                ))}
                                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs ml-auto bg-slate-50 px-3 py-2 rounded-xl">
                                    <Clock size={16} className="text-slate-300"/> {minutesToHMM(movie.durationMin)}
                                </div>
                            </div>

                            {/* Трейлер */}
                            <div className="w-full aspect-video rounded-[2rem] overflow-hidden bg-slate-900 relative mb-8 shadow-2xl">
                                {movie.trailerUrl ? (
                                    <iframe className="w-full h-full" src={movie.trailerUrl} title="Trailer" allowFullScreen />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                                        <PlayCircle size={48} className="opacity-10 mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{t('movie.no_trailer')}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium mb-8">{movie.description || t('movie.no_description')}</p>

                            <MovieMeta movie={movie} t={t} />
                        </div>

                        <div className="pt-8 border-t border-slate-100 mt-auto flex gap-4">
                            <Button
                                onClick={() => onFindTheaters(movie)}
                                className={`flex-1 ${styles.actionBtn}`}
                                icon={MapPin}
                            >
                                {t('movie.where_to_watch')}
                            </Button>

                            <Button
                                onClick={() => onToggleWatchlist(movie.id)}
                                variant={isFavorite ? "danger" : "ghost"}
                                icon={(props) => (
                                    <Heart
                                        {...props}
                                        fill={isFavorite ? "currentColor" : "none"}
                                    />
                                )}
                                className={`!p-5 border ${!isFavorite ? "border-slate-100" : "border-red-200"}`}
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};