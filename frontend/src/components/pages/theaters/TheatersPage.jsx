import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    MapPin, Film, ChevronDown, Star,
    Search
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { PageHeader } from "../PageHeader";
import { LoadingState } from "../LoadingState.jsx";
import { EmptyState } from "../../ui/EmptyState.jsx";
import { ErrorState } from "../../ui/ErrorState.jsx";
import { MovieCard } from "../../movies/grid/MovieCard";

import { CalendarPicker } from "./CalendarPicker";
import { TheatersMap } from "./TheatersMap";
import { showtimeAPI, theaterAPI, movieAPI } from "../../../services/api";

export const TheatersPage = ({
                                 currentMovie: propMovie,
                                 setStep,
                                 onPickShowtime,
                                 onOpenMovie,
                                 selectedDate,
                                 setSelectedDate,
                                 selectedCity,
                                 setSelectedCity
                             }) => {
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language === 'en' ? 'en-US' : 'uk-UA';
    const todayStr = new Date().toISOString().split("T")[0];

    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    const [showtimes, setShowtimes] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [cities, setCities] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [nextDate, setNextDate] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const [isCityOpen, setIsCityOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef(null);

    const fetchCities = useCallback(async () => {
        try {
            const res = await theaterAPI.getCities();
            const data = res.data.cities || res.data;
            setCities(data);
            if (data.length > 0 && !selectedCity) {
                setSelectedCity(data[0]);
                return data[0];
            }
            return selectedCity;
        } catch (e) {
            console.error("Cities load error:", e);
            throw e;
        }
    }, [selectedCity, setSelectedCity]);

    const loadContent = useCallback(async (city = selectedCity) => {
        if (!propMovie) {
            setIsLoading(false);
            return;
        }

        if (!city) return;

        try {
            const [showRes, theaterRes, recRes] = await Promise.all([
                showtimeAPI.getShowtimes({
                    movieId: propMovie.id,
                    date: selectedDate,
                    cityId: city.id
                }),
                theaterAPI.getAll({ cityId: city.id }),
                movieAPI.getRecommended(propMovie.id)
            ]);

            const now = new Date();
            const filteredShowtimes = (showRes.data || []).filter(st => {
                return new Date(st.startTime) > now;
            });

            setShowtimes(filteredShowtimes);
            setTheaters(theaterRes.data.theaters || theaterRes.data || []);
            setRecommended(recRes.data || []);

            if (filteredShowtimes.length === 0) {
                const allFutureRes = await showtimeAPI.getShowtimes({
                    movieId: propMovie.id,
                    cityId: city.id
                });

                const futureDates = (allFutureRes.data || [])
                    .filter(st => new Date(st.startTime) > now)
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

                setNextDate(futureDates.length > 0 ? new Date(futureDates[0].startTime) : null);
            } else {
                setNextDate(null);
            }

            setError(false);
        } catch (e) {
            console.error("Content load error:", e);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    }, [propMovie, selectedDate, selectedCity]);

    const handleGoToDate = useCallback((date) => {
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        setViewDate(date);
    }, [setSelectedDate]);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                const city = await fetchCities();
                await loadContent(city);
            } catch (e) {
                setError(true);
                setIsLoading(false);
            }
        };
        init();
    }, [fetchCities, loadContent]);

    useEffect(() => {
        if (!isLoading && !error) {
            loadContent();
        }
    }, [selectedDate, selectedCity?.id, loadContent, isLoading, error]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target)) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (error) return <ErrorState onRetry={() => window.location.reload()} onBack={() => setStep("home")} />;

    if (!propMovie && !isLoading) {
        return (
            <EmptyState
                variant="dashed"
                icon={Search}
                title={t('theaters.no_movie_title')}
                description={t('theaters.no_movie_text')}
                onAction={() => setStep("home")}
                actionLabel={t('theaters.back_home')}
            />
        );
    }

    if (isLoading) return <LoadingState label={t('theaters.sync')} />;

    // 4. Основний контент
    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                title={propMovie?.title || ""}
                subtitle={t('theaters.currently_selected')}
                icon={Film}
                iconBg="bg-red-500"
                onBack={() => setStep("home")}
                backLabel={t('theaters.back_home')}
            />

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <button
                        onClick={() => setIsCityOpen(!isCityOpen)}
                        className="flex items-center gap-3 bg-white px-8 py-4 rounded-[1.8rem] border border-slate-100 shadow-sm font-black text-slate-900 uppercase tracking-tighter hover:border-blue-400 active:scale-[0.98] transition-all"
                    >
                        <MapPin size={18} className="text-red-500" /> {selectedCity?.name || t('common.select_city')}
                        <ChevronDown size={14} className={`ml-2 transition-transform duration-300 ${isCityOpen ? 'rotate-180' : 'opacity-30'}`} />
                    </button>

                    <AnimatePresence>
                        {isCityOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-56 bg-white rounded-[2rem] shadow-2xl border border-slate-50 p-3 z-[120]"
                            >
                                {cities.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setSelectedCity(c); setIsCityOpen(false); }}
                                        className="w-full text-left px-5 py-3 hover:bg-blue-600 hover:text-white rounded-2xl text-xs font-black uppercase transition-all mb-1 active:scale-95"
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <CalendarPicker
                    isOpen={isCalendarOpen}
                    setIsOpen={setIsCalendarOpen}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    viewDate={viewDate}
                    setViewDate={setViewDate}
                    todayStr={todayStr}
                    currentLocale={currentLocale}
                    t={t}
                    calendarRef={calendarRef}
                />
            </div>

            <TheatersMap
                key={`${selectedCity?.id}-${selectedDate}`}
                theaters={theaters}
                showtimes={showtimes}
                selectedCity={selectedCity}
                onPickShowtime={onPickShowtime}
                nextDate={nextDate}
                onGoToDate={handleGoToDate}
            />

            <section className="space-y-8 pt-6">
                <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900 px-2 flex items-center gap-3">
                    <Star className="text-yellow-400" fill="currentColor" /> {t('theaters.recommended')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {recommended.map((m) => (
                        <MovieCard
                            key={m.id}
                            movie={m}
                            t={t}
                            onOpen={onOpenMovie}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};