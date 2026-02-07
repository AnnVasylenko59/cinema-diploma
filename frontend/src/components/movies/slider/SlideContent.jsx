import React from "react";
import { motion } from "framer-motion";
import { Play, Star, ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { minutesToHMM } from "../../../utils";
import { textVariants, styles as s } from "./SliderStyles";

export const SlideContent = ({ item, i, t, next, prev, onWatchTrailer }) => (
    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 z-20 pointer-events-none">
        <motion.div key={i} variants={textVariants} initial="enter" animate="center" exit="exit" className="max-w-4xl space-y-4 pointer-events-auto">

            {/* Бейджі - Перевикористання логіки стилів */}
            <div className="flex items-center gap-3 mb-2">
                <div className={`${s.badge} bg-white/10 border-white/10 text-white/90`}>
                    <Calendar size={12} className="opacity-70"/>
                    <span className="text-[11px] font-bold leading-none">{item.year}</span>
                </div>
                <div className={`${s.badge} bg-yellow-400/20 border-yellow-400/30 text-yellow-300`}>
                    <Star size={12} fill="currentColor"/>
                    <span className="text-[11px] font-bold leading-none">{item.rating || '0.0'}</span>
                </div>
            </div>

            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight uppercase leading-[0.95] text-white drop-shadow-2xl">{item.title}</h2>

            <div className="flex flex-wrap items-center gap-5 text-[12px] font-semibold uppercase tracking-wider text-white/80 pt-1">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-red-500"/>
                    <span>{minutesToHMM(item.durationMin)}</span>
                </div>
                <div className="flex gap-4">
                    {item.genres?.slice(0, 3).map((g) => (
                        <span key={g.genre?.id || g} className="text-blue-400">
                            {t(`filters.genres.${g.genre?.name || g}`)}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-5 pt-8">
                <button onClick={() => onWatchTrailer(item)} className="group flex items-center justify-center px-10 py-4 bg-white text-slate-950 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95">
                    <Play className="mr-2 transition-transform group-hover:scale-110" size={16} fill="currentColor"/>
                    {t('movie.details')}
                </button>

                <div className="flex gap-3">
                    <button onClick={prev} className={s.navBtn}><ChevronLeft size={20}/></button>
                    <button onClick={next} className={s.navBtn}><ChevronRight size={20}/></button>
                </div>
            </div>
        </motion.div>
    </div>
);