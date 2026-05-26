import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, Clock, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { styles } from "./FilterStyles";
import { GenreTags } from "./GenreTags";

export const FiltersBar = ({
                               genres = [], selectedGenres = [], setSelectedGenres,
                               duration, setDuration, query, setQuery
                           }) => {
    const { t } = useTranslation();

    const [isGenreOpen, setIsGenreOpen] = useState(false);
    const genreRef = useRef(null);

    const [isDurationOpen, setIsDurationOpen] = useState(false);
    const durationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (genreRef.current && !genreRef.current.contains(event.target)) {
                setIsGenreOpen(false);
            }
            if (durationRef.current && !durationRef.current.contains(event.target)) {
                setIsDurationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleGenre = (genreName) => {
        if (selectedGenres.includes(genreName)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genreName));
        } else {
            setSelectedGenres([...selectedGenres, genreName]);
        }
    };

    const durationOptions = [
        { value: "any", label: t('booking.any_duration') },
        { value: "short", label: t('filters.duration_options.short') || "Короткі (до 90 хв)" },
        { value: "medium", label: t('filters.duration_options.medium') || "Середні (90 - 130 хв)" },
        { value: "long", label: t('filters.duration_options.long') || "Довгі (понад 130 хв)" }
    ];

    const currentDurationLabel = durationOptions.find(opt => opt.value === duration)?.label || t('booking.any_duration');

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4 bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-100/40 items-center">

                {/* 1. Пошук */}
                <div className={`${styles.fieldWrapper} md:col-span-2 group`}>
                    <Search size={18} className="text-blue-500 shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('filters.search_placeholder')}
                        className="w-full bg-transparent outline-none text-xs font-semibold text-gray-700 placeholder-gray-400"
                    />
                </div>

                {/* 2. Dropdown Жанрів */}
                <div className="relative" ref={genreRef}>
                    <div
                        onClick={() => { setIsGenreOpen(!isGenreOpen); setIsDurationOpen(false); }}
                        className={`${styles.fieldWrapper} cursor-pointer justify-between select-none`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Filter size={16} className="text-blue-500 shrink-0" />
                            <span className="text-xs font-bold text-gray-600 truncate">
                                {selectedGenres.length > 0
                                    ? `${t('filters.genres_label')}: ${selectedGenres.length}`
                                    : t('filters.genres_label')}
                            </span>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isGenreOpen ? "rotate-180" : ""}`} />
                    </div>

                    <AnimatePresence>
                        {isGenreOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 p-3 max-h-[260px] overflow-y-auto custom-inner-scrollbar"
                            >
                                <div className="space-y-1">
                                    {genres.map(g => {
                                        const isChecked = selectedGenres.includes(g.name);
                                        return (
                                            <div
                                                key={g.id}
                                                onClick={() => toggleGenre(g.name)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${isChecked ? "bg-blue-50/50 text-blue-600" : "text-gray-600 hover:bg-slate-50"}`}
                                            >
                                                <span>{t(`filters.genres.${g.name}`, g.name)}</span>
                                                {isChecked && <Check size={14} className="text-blue-500" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. Dropdown Тривалості */}
                <div className="relative" ref={durationRef}>
                    <div
                        onClick={() => { setIsDurationOpen(!isDurationOpen); setIsGenreOpen(false); }}
                        className={`${styles.fieldWrapper} cursor-pointer justify-between select-none`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Clock size={16} className="text-blue-500 shrink-0" />
                            <span className="text-xs font-bold text-gray-600 truncate">
                                {currentDurationLabel}
                            </span>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isDurationOpen ? "rotate-180" : ""}`} />
                    </div>

                    <AnimatePresence>
                        {isDurationOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 p-3 overflow-hidden"
                            >
                                <div className="space-y-1">
                                    {durationOptions.map(opt => {
                                        const isSelected = duration === opt.value;
                                        return (
                                            <div
                                                key={opt.value}
                                                onClick={() => {
                                                    setDuration(opt.value);
                                                    setIsDurationOpen(false);
                                                }}
                                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${isSelected ? "bg-blue-50/50 text-blue-600" : "text-gray-600 hover:bg-slate-50"}`}
                                            >
                                                <span>{opt.label}</span>
                                                {isSelected && <Check size={14} className="text-blue-500" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* 4. Теги обраних жанрів */}
            <GenreTags
                items={selectedGenres}
                onRemove={(name) => setSelectedGenres(selectedGenres.filter(x => x !== name))}
                onClear={() => setSelectedGenres([])}
            />
        </div>
    );
};