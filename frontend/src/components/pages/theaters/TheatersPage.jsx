import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Film, ChevronDown, Star, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import * as Sentry from "@sentry/react";

import { PageHeader } from "../PageHeader";
import { LoadingState } from "../LoadingState.jsx";
import { EmptyState } from "../../ui/EmptyState.jsx";
import { ErrorState } from "../../ui/ErrorState.jsx";
import { MovieCard } from "../../movies/grid/MovieCard";

import { CalendarPicker } from "./CalendarPicker";
import { TheatersMap } from "./TheatersMap";

import { showtimeAPI, theaterAPI, movieAPI, logAPI } from "../../../services/api";

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
    const currentLocale = i18n.language?.startsWith('en') ? 'en-US' : 'uk-UA';
    const prismaLang = i18n.language?.startsWith('en') ? 'en' : 'uk';
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

    const isInitialized = useRef(false);

    const fetchCities = useCallback(async () => {
        try {
            const res = await theaterAPI.getCities({ lang: prismaLang });
            const data = res.data.cities || res.data;
            setCities(data);
            return data;
        } catch (error) {
            console.error("Cities load error:", error);
            throw error;
        }
    }, [prismaLang]);

    const loadContent = useCallback(async (city, date) => {
        if (!propMovie || !city) {
            return false;
        }

        try {
            const [showRes, theaterRes, recRes] = await Promise.all([
                showtimeAPI.getShowtimes({
                    movieId: propMovie.id,
                    date: date,
                    cityId: city.id,
                    lang: prismaLang
                }),
                theaterAPI.getAll({ cityId: city.id, lang: prismaLang }),
                movieAPI.getRecommended({ lang: prismaLang })
            ]);

            const now = new Date();
            const filteredShowtimes = (showRes.data || []).filter(st => {
                return new Date(st.startTime) > now;
            });

            setShowtimes(filteredShowtimes);
            setTheaters(theaterRes.data.theaters || theaterRes.data || []);
            setRecommended(recRes.data?.movies || recRes.data || []);

            if (filteredShowtimes.length === 0) {
                const allFutureRes = await showtimeAPI.getShowtimes({
                    movieId: propMovie.id,
                    cityId: city.id,
                    lang: prismaLang
                });

                const futureDates = (allFutureRes.data || [])
                    .filter(st => new Date(st.startTime) > now)
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

                setNextDate(futureDates.length > 0 ? new Date(futureDates[0].startTime) : null);
            } else {
                setNextDate(null);
            }

            return true;
        } catch (error) {
            console.error("Content load error:", error);
            throw error;
        }
    }, [propMovie, prismaLang]);

    const handleGoToDate = useCallback((date) => {
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        setViewDate(date);
    }, [setSelectedDate]);

    const handleCitySelect = useCallback((city) => {
        setSelectedCity(city);
        setIsCityOpen(false);
    }, [setSelectedCity]);

    // Initial load
    useEffect(() => {
        if (isInitialized.current) return;

        const initialize = async () => {
            setIsLoading(true);
            setError(false);

            try {
                const citiesData = await fetchCities();

                let currentCity = selectedCity;
                if (!currentCity && citiesData.length > 0) {
                    currentCity = citiesData[0];
                    setSelectedCity(currentCity);
                }

                if (currentCity && propMovie) {
                    await loadContent(currentCity, selectedDate);
                }

                isInitialized.current = true;
            } catch (error) {
                console.error("Initialization error:", error);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, [fetchCities, propMovie, selectedCity, setSelectedCity, loadContent, selectedDate]);

    // Update when date or city changes
    useEffect(() => {
        if (!isInitialized.current || !selectedCity || !propMovie) {
            return;
        }

        const updateContent = async () => {
            setIsLoading(true);
            try {
                await loadContent(selectedCity, selectedDate);
            } catch {
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        updateContent();
    }, [selectedDate, selectedCity, propMovie, loadContent]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (error) {
        return (
            <ErrorState
                type="500"
                onRetry={() => window.location.reload()}
                onBack={() => setStep("home")}
                onReport={() => {
                    logAPI.sendError("Користувач повідомив про проблему на сторінці Кінотеатрів", {
                        page: "TheatersPage",
                        movieId: propMovie?.id,
                        cityId: selectedCity?.id,
                        selectedDate: selectedDate,
                        action: "User clicked report button"
                    });

                    const eventId = Sentry.captureMessage("User Feedback: Issue on TheatersPage");
                    Sentry.showReportDialog({ eventId });
                }}
            />
        );
    }

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
                        key={prismaLang}
                        onClick={() => setIsCityOpen(!isCityOpen)}
                        className="flex items-center gap-3 bg-white px-8 py-4 rounded-[1.8rem] border border-slate-100 shadow-sm font-black text-slate-900 uppercase tracking-tighter hover:border-blue-400 active:scale-[0.98] transition-all"
                    >
                        <MapPin size={18} className="text-red-500" /> {selectedCity?.name || t('common.select_city')}
                        <ChevronDown size={14} className={`ml-2 transition-transform duration-300 ${isCityOpen ? 'rotate-180' : 'opacity-30'}`} />
                    </button>

                    <AnimatePresence>
                        {isCityOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-56 bg-white rounded-[2rem] shadow-2xl border border-slate-50 p-3 z-[120]"
                            >
                                {cities.length > 0 ? (
                                    cities.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleCitySelect(c)}
                                            className="w-full text-left px-5 py-3 hover:bg-blue-600 hover:text-white rounded-2xl text-xs font-black uppercase transition-all mb-1 active:scale-95"
                                        >
                                            {c.name}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-5 py-3 text-xs text-slate-400 text-center">
                                        {t('common.no_cities')}
                                    </div>
                                )}
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
                key={`${selectedCity?.id}-${selectedDate}-${prismaLang}`}
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
                    {Array.isArray(recommended) && recommended.map((m) => (
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