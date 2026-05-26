import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Film, BarChart3, Plus, Trash2, Edit2, TrendingUp, DollarSign, Ticket, Clock, Undo2, Save, ArrowLeft, Calendar, ChevronDown, ChevronUp, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// Використовуємо наш локалізований інстанс з інтерцептором мови замість сирого axios
import api, { showtimeAPI, theaterAPI} from "../../../../services/api.js";

/**
 * КОМПОНЕНТ: Модальне вікно панелі адміністратора у повітряному та просторому стилі сайту.
 */
export const AdminModal = ({ isOpen, onClose, movies = [], genres = [], onRefresh }) => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState("movies");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Визначаємо поточний мовний прапор для дат та АПІ
    const currentLocale = i18n.language?.startsWith('en') ? 'en-US' : 'uk-UA';
    const prismaLang = i18n.language?.startsWith('en') ? 'en' : 'uk';

    // Пошукові запити
    const [movieSearch, setMovieSearch] = useState("");
    const [showtimeSearch, setShowtimeSearch] = useState("");

    // Стейти для фільмів
    const [editingMovie, setEditingMovie] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        title: "", year: "", durationMin: "", backdropUrl: "",
        posterUrl: "", trailerUrl: "", description: "", director: "", actors: ""
    });
    const [localizedTitles, setLocalizedTitles] = useState({ uk: "", en: "" });
    const [localizedDescriptions, setLocalizedDescriptions] = useState({ uk: "", en: "" });
    const [selectedGenres, setSelectedGenres] = useState([]);

    // Стейти для керування розкладом сеансів (Showtimes)
    const [showtimes, setShowtimes] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [isAddingShowtime, setIsAddingShowtime] = useState(false);
    const [editingShowtime, setEditingShowtime] = useState(null);
    const [showtimeData, setShowtimeData] = useState({
        movieId: "", theaterId: "", hallId: "", startTime: "", price: "120"
    });

    // Стейт для живої статистики з АПІ
    const [stats, setStats] = useState({
        revenue: 0,
        ticketsSold: 0,
        occupancyRate: 0,
        topMovies: []
    });
    const [isStatsLoading, setIsStatsLoading] = useState(false);

    // Стейт для розгорнутих фільмів та дат (Акордеони)
    const [expandedMovies, setExpandedMovies] = useState({});
    const [expandedDates, setExpandedDates] = useState({});

    // Рефи та стейти для Undo (Фільми)
    const [pendingDelete, setPendingDelete] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const deleteTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    const [pendingDeleteShowtime, setPendingDeleteShowtime] = useState(null);
    const [showtimeTimeLeft, setShowtimeTimeLeft] = useState(15);
    const showtimeDeleteTimerRef = useRef(null);
    const showtimeCountdownIntervalRef = useRef(null);

    const displayedMovies = useMemo(() => {
        return movies
            .filter(m => m.id !== pendingDelete?.id)
            .filter(m => {
                if (!movieSearch) return true;
                const query = movieSearch.toLowerCase();
                const titleToSearch = m.title?.toLowerCase() || "";
                const directorToSearch = m.director?.toLowerCase() || "";
                return titleToSearch.includes(query) || directorToSearch.includes(query);
            });
    }, [movies, pendingDelete, movieSearch]);

    const bundledShowtimes = useMemo(() => {
        const movieMap = {};
        const filteredShowtimes = showtimes.filter(st => {
            if (pendingDeleteShowtime && st.id === pendingDeleteShowtime.id) return false;
            if (!showtimeSearch) return true;
            const query = showtimeSearch.toLowerCase();
            return st.movie?.title?.toLowerCase().includes(query) || st.hall?.theater?.name?.toLowerCase().includes(query);
        });

        filteredShowtimes.forEach((st) => {
            const movieId = st.movieId || st.movie?.id || "unknown";
            const movieTitle = st.movie?.title || t("admin.movies.unknown", "Untitled");
            const posterUrl = st.movie?.posterUrl || "";

            if (!movieMap[movieId]) {
                movieMap[movieId] = { movieId, title: movieTitle, posterUrl, dates: {} };
            }

            const dateKey = st.startTime ? new Date(st.startTime).toISOString().split('T')[0] : "unknown-date";

            if (!movieMap[movieId].dates[dateKey]) {
                movieMap[movieId].dates[dateKey] = {
                    dateKey,
                    formattedDate: st.startTime ? new Date(st.startTime).toLocaleDateString(currentLocale, {
                        weekday: "short", month: "long", day: "numeric"
                    }) : t("admin.showtimes.unknown_date", "Date not specified"),
                    items: []
                };
            }
            movieMap[movieId].dates[dateKey].items.push(st);
        });

        return Object.values(movieMap).map(movie => {
            const sortedDates = Object.values(movie.dates).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
            sortedDates.forEach(d => d.items.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
            return { ...movie, dates: sortedDates };
        });
    }, [showtimes, pendingDeleteShowtime, showtimeSearch, t, currentLocale]);

    const loadShowtimesData = async () => {
        try {
            const [stRes, thRes] = await Promise.all([
                showtimeAPI.getShowtimes({ lang: prismaLang }),
                theaterAPI.getAll({ lang: prismaLang })
            ]);
            setShowtimes(stRes.data || []);
            setTheaters(thRes.data.theaters || thRes.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadStatsData = async () => {
        setIsStatsLoading(true);
        try {
            const res = await api.get(`/movies/stats?lang=${prismaLang}`);
            if (res.data) {
                setStats({
                    revenue: res.data.revenue || 0,
                    ticketsSold: res.data.ticketsSold || 0,
                    occupancyRate: res.data.occupancyRate || 0,
                    topMovies: res.data.topMovies || []
                });
            }
        } catch (err) {
            console.error("Помилка при завантаженні статистики з API:", err);
        } finally {
            setIsStatsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (activeTab === "showtimes") loadShowtimesData();
            if (activeTab === "stats") loadStatsData();
        }
    }, [isOpen, activeTab, prismaLang]);

    const resetForm = () => {
        setFormData({
            title: "", year: "", durationMin: "", backdropUrl: "",
            posterUrl: "", trailerUrl: "", description: "", director: "", actors: ""
        });
        setLocalizedTitles({ uk: "", en: "" });
        setLocalizedDescriptions({ uk: "", en: "" });
        setSelectedGenres([]);
    };

    const resetShowtimeForm = () => {
        setShowtimeData({ movieId: "", theaterId: "", hallId: "", startTime: "", price: "120" });
        setEditingShowtime(null);
        setIsAddingShowtime(false);
    };

    const executeRealDelete = async (movieId) => {
        setIsDeleting(true);
        try {
            await api.delete(`/movies/${movieId}`);
            onRefresh?.();
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
            setPendingDelete(null);
        }
    };

    const handleActionDelete = (movie) => {
        if (pendingDelete) {
            clearTimeout(deleteTimerRef.current);
            clearInterval(countdownIntervalRef.current);
            executeRealDelete(pendingDelete.id);
        }
        setPendingDelete(movie);
        setTimeLeft(15);
        countdownIntervalRef.current = setInterval(() => {
            setTimeLeft((prev) => (prev <= 1 ? (clearInterval(countdownIntervalRef.current), 0) : prev - 1));
        }, 1000);
        deleteTimerRef.current = setTimeout(() => {
            clearInterval(countdownIntervalRef.current);
            executeRealDelete(movie.id);
        }, 15000);
    };

    const handleUndo = () => {
        clearTimeout(deleteTimerRef.current);
        clearInterval(countdownIntervalRef.current);
        setPendingDelete(null);
    };

    const executeRealDeleteShowtime = async (showtimeId) => {
        try {
            await api.delete(`/showtimes/${showtimeId}`);
            loadShowtimesData();
        } catch (error) {
            console.error(error);
        } finally {
            setPendingDeleteShowtime(null);
        }
    };

    const handleActionDeleteShowtime = (st) => {
        if (pendingDeleteShowtime) {
            clearTimeout(showtimeDeleteTimerRef.current);
            clearInterval(showtimeCountdownIntervalRef.current);
            executeRealDeleteShowtime(pendingDeleteShowtime.id);
        }
        setPendingDeleteShowtime(st);
        setShowtimeTimeLeft(15);
        showtimeCountdownIntervalRef.current = setInterval(() => {
            setShowtimeTimeLeft((prev) => (prev <= 1 ? (clearInterval(showtimeCountdownIntervalRef.current), 0) : prev - 1));
        }, 1000);
        showtimeDeleteTimerRef.current = setTimeout(() => {
            clearInterval(showtimeCountdownIntervalRef.current);
            executeRealDeleteShowtime(st.id);
        }, 15000);
    };

    const handleUndoShowtime = () => {
        clearTimeout(showtimeDeleteTimerRef.current);
        clearInterval(showtimeCountdownIntervalRef.current);
        setPendingDeleteShowtime(null);
    };

    const handleStartEdit = (movie) => {
        setEditingMovie(movie);
        setIsAdding(false);

        setFormData({
            title: movie.title || "",
            year: movie.year || "",
            durationMin: movie.durationMin || "",
            backdropUrl: movie.backdropUrl || "",
            posterUrl: movie.posterUrl || "",
            trailerUrl: movie.trailerUrl || "",
            description: movie.description || "",
            director: movie.director || "",
            actors: movie.actors || ""
        });

        const ukTitle = movie.translations?.find(t => t.language === 'uk')?.title || movie.title || "";
        const enTitle = movie.translations?.find(t => t.language === 'en')?.title || movie.title || "";
        const ukDesc = movie.translations?.find(t => t.language === 'uk')?.description || movie.description || "";
        const enDesc = movie.translations?.find(t => t.language === 'en')?.description || movie.description || "";

        setLocalizedTitles({ uk: ukTitle, en: enTitle });
        setLocalizedDescriptions({ uk: ukDesc, en: enDesc });

        setSelectedGenres(movie.genres ? movie.genres.map(mg => mg.genre.name) : []);
    };

    const handleStartEditShowtime = (st) => {
        setEditingShowtime(st);
        setIsAddingShowtime(false);

        const dateObj = new Date(st.startTime);
        const localISO = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

        setShowtimeData({
            movieId: st.movieId?.toString() || st.movie?.id?.toString() || "",
            theaterId: st.hall?.theaterId?.toString() || "",
            hallId: st.hallId?.toString() || "",
            startTime: localISO,
            price: st.price?.toString() || "120"
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocalizedTitleChange = (lang, value) => {
        setLocalizedTitles(prev => ({ ...prev, [lang]: value }));
    };

    const handleLocalizedDescriptionChange = (lang, value) => {
        setLocalizedDescriptions(prev => ({ ...prev, [lang]: value }));
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        if (selectedGenres.length === 0) {
            alert(t("admin.movies.genres_empty_error", "Please select at least one genre!"));
            return;
        }
        setIsSaving(true);
        try {
            const formattedData = {
                ...formData,
                year: formData.year ? parseInt(formData.year, 10) : undefined,
                durationMin: formData.durationMin ? parseInt(formData.durationMin, 10) : undefined,
                genres: selectedGenres,
                lang: prismaLang,
                translations: {
                    uk: {
                        title: localizedTitles.uk,
                        description: localizedDescriptions.uk
                    },
                    en: {
                        title: localizedTitles.en,
                        description: localizedDescriptions.en
                    }
                }
            };

            if (editingMovie) {
                await api.put(`/movies/${editingMovie.id}`, formattedData);
            } else if (isAdding) {
                await api.post("/movies", formattedData);
            }
            setEditingMovie(null);
            setIsAdding(false);
            resetForm();
            onRefresh?.();
        } catch (error) {
            console.error(error);
            alert("Error saving movie data");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveShowtimeForm = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                movieId: parseInt(showtimeData.movieId, 10),
                hallId: parseInt(showtimeData.hallId, 10),
                startTime: new Date(showtimeData.startTime).toISOString(),
                price: parseFloat(showtimeData.price)
            };

            if (editingShowtime) {
                await api.put(`/showtimes/${editingShowtime.id}`, payload);
            } else {
                await api.post("/showtimes", payload);
            }

            resetShowtimeForm();
            loadShowtimesData();
        } catch (err) {
            console.error(err);
            alert("Error saving showtime data");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleMovieExpand = (movieId) => {
        setExpandedMovies(prev => ({ ...prev, [movieId]: !prev[movieId] }));
    };

    const toggleDateExpand = (movieId, dateKey) => {
        const key = `${movieId}-${dateKey}`;
        setExpandedDates(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSafeClose = () => {
        if (pendingDelete) executeRealDelete(pendingDelete.id);
        if (pendingDeleteShowtime) executeRealDeleteShowtime(pendingDeleteShowtime.id);
        onClose();
    };

    useEffect(() => {
        return () => {
            clearTimeout(deleteTimerRef.current);
            clearInterval(countdownIntervalRef.current);
            clearTimeout(showtimeDeleteTimerRef.current);
            clearInterval(showtimeCountdownIntervalRef.current);
        };
    }, []);

    if (!isOpen) return null;

    const showMovieForm = isAdding || !!editingMovie;
    const showShowtimeForm = isAddingShowtime || !!editingShowtime;
    const selectedTheaterObj = theaters.find(t => t.id === parseInt(showtimeData.theaterId, 10));
    const availableHalls = selectedTheaterObj ? selectedTheaterObj.halls : [];

    const maxRevenue = Math.max(...stats.topMovies.map(m => m.revenue || 1), 1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/30 backdrop-blur-[8px]">
            <motion.div
                key={prismaLang}
                initial={{ opacity: 0, scale: 0.99, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: 15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-[#F8FAFC] rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden border border-white/60 relative"
            >
                {/* Хедер Панелі */}
                <div className="px-12 py-7 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100/80 shadow-sm shadow-slate-100/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50/60 text-blue-600 rounded-2xl border border-blue-100/30"><Film size={22} /></div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800">{t("admin.title")}</h2>
                            <p className="text-xs text-slate-400 font-normal mt-1 tracking-wide">{t("header.subtitle")}</p>
                        </div>
                    </div>
                    <button onClick={handleSafeClose} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"><X size={18} /></button>
                </div>

                {/* Навігація */}
                {!showMovieForm && !showShowtimeForm && (
                    <div className="px-12 bg-white border-b border-slate-100/60 flex gap-8 pt-3">
                        <button onClick={() => setActiveTab("movies")} className={`flex items-center gap-2 pb-5 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all duration-200 ${activeTab === "movies" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}><Film size={14} /> {t("profile_menu.settings")}</button>
                        <button onClick={() => setActiveTab("showtimes")} className={`flex items-center gap-2 pb-5 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all duration-200 ${activeTab === "showtimes" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}><Calendar size={14} /> {t("booking.showtime")}</button>
                        <button onClick={() => setActiveTab("stats")} className={`flex items-center gap-2 pb-5 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all duration-200 ${activeTab === "stats" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}><BarChart3 size={14} /> {t("admin.stats_title")}</button>
                    </div>
                )}

                {/* Головний Контент */}
                <div className="flex-1 overflow-y-auto p-12 space-y-6">

                    {/* ТАБ 1: КЕРУВАННЯ ФІЛЬМАМИ */}
                    {activeTab === "movies" && (
                        showMovieForm ? (
                            <form onSubmit={handleSaveForm} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100/50 space-y-7 max-w-4xl mx-auto">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingMovie(null); resetForm(); }} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft size={14} /> {t("profile.buttons.home")}</button>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50/60 px-4 py-1.5 rounded-full border border-blue-100/20">{editingMovie ? t("admin.edit_movie") : t("admin.add_movie")}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                                            {t("admin.fields.title_ua")} (Українська) *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={localizedTitles.uk}
                                            onChange={(e) => handleLocalizedTitleChange('uk', e.target.value)}
                                            className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm font-medium"
                                            placeholder="Введіть назву українською"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                                            {t("admin.fields.title_en")} (English) *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={localizedTitles.en}
                                            onChange={(e) => handleLocalizedTitleChange('en', e.target.value)}
                                            className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm font-medium"
                                            placeholder="Enter English title"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("admin.fields.director")}</label>
                                        <input type="text" name="director" value={formData.director} onChange={handleInputChange} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("admin.fields.year")} *</label>
                                        <input required type="number" name="year" value={formData.year} onChange={handleInputChange} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("admin.fields.duration")} *</label>
                                        <input required type="number" name="durationMin" value={formData.durationMin} onChange={handleInputChange} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-2">
                                        <Users size={14} /> Актори / Cast
                                    </label>
                                    <textarea
                                        rows="2"
                                        name="actors"
                                        value={formData.actors}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm resize-none"
                                        placeholder="David Corenswet, Rachel Brosnahan, Nicholas Hoult, Isabella Merced"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1.5">Список акторів (не залежить від мови)</p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2.5">{t("profile.tabs.genres")} *</label>
                                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50/40 rounded-2xl border border-slate-100">
                                        {genres.map((g) => {
                                            const isSel = selectedGenres.includes(g.name);
                                            return (
                                                <button key={g.id} type="button" onClick={() => setSelectedGenres(p => p.includes(g.name) ? p.filter(n => n !== g.name) : [...p, g.name])} className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all border ${isSel ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100/60" : "bg-white border-slate-200/60 text-slate-500 hover:border-slate-300"}`}>{t(`filters.genres.${g.name}`)}</button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("admin.fields.description_ua")} (Українська) *</label>
                                    <textarea required rows="3" value={localizedDescriptions.uk} onChange={(e) => handleLocalizedDescriptionChange('uk', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm resize-none leading-relaxed" placeholder="Опис фільму українською" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("admin.fields.description_en")} (English) *</label>
                                    <textarea required rows="3" value={localizedDescriptions.en} onChange={(e) => handleLocalizedDescriptionChange('en', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200/60 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm resize-none leading-relaxed" placeholder="Movie description in English" />
                                </div>

                                <div className="flex justify-end gap-3 border-t border-slate-50 pt-5">
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-2xl text-xs font-semibold shadow-md shadow-blue-100 transition-all">{isSaving ? t("home.updating") : t("profile.buttons.save")}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-[2rem] border border-slate-100/60 shadow-sm items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 pl-2">{t("home.found_count", { count: displayedMovies.length })}</span>
                                    <input
                                        type="text"
                                        placeholder={t("filters.search_placeholder")}
                                        value={movieSearch}
                                        onChange={(e) => setMovieSearch(e.target.value)}
                                        className="px-5 py-2.5 text-xs rounded-xl border border-slate-200/60 focus:outline-none focus:border-blue-400 font-medium text-slate-700 w-full sm:max-w-xs transition-colors"
                                    />
                                    <button onClick={() => { setIsAdding(true); resetForm(); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm shrink-0 transition-all"><Plus size={14} /> {t("admin.add_movie")}</button>
                                </div>

                                <div className="bg-white rounded-[2.5rem] border border-slate-100/40 shadow-sm overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100/60">
                                            <th className="px-8 py-4.5">{t("validation.film")}</th>
                                            <th className="px-8 py-4.5">{t("filters.genres_label")}</th>
                                            <th className="px-8 py-4.5">{t("profile.fields.language")}</th>
                                            <th className="px-8 py-4.5 text-right">Дії</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-xs">
                                        {displayedMovies.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/20 transition-colors">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <img src={m.posterUrl || "https://via.placeholder.com/40x60"} alt="" className="w-9 h-12 rounded-lg object-cover shadow-sm bg-slate-100 border border-slate-100" />
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-sm">{m.title}</div>
                                                            <div className="text-[11px] text-slate-400 font-medium mt-1">{m.director || t("movie.unknown")}, {m.year}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {m.genres?.map(g => <span key={g.genre.id} className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-md">{t(`filters.genres.${g.genre.name}`)}</span>)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-slate-500 font-medium">{m.durationMin} min</td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex justify-end gap-2 pr-2">
                                                        <button onClick={() => handleStartEdit(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-all"><Edit2 size={14} /></button>
                                                        <button disabled={isDeleting} onClick={() => handleActionDelete(m)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/60 rounded-xl transition-all"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}

                    {/* ТАБ 2: КЕРУВАННЯ РОЗКЛАДОМ СЕАНСІВ */}
                    {activeTab === "showtimes" && (
                        showShowtimeForm ? (
                            <form onSubmit={handleSaveShowtimeForm} className="bg-white p-10 rounded-[2.5rem] border border-slate-100/50 shadow-sm space-y-6 max-w-2xl mx-auto">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                                    <button type="button" onClick={resetShowtimeForm} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft size={14} /> {t("booking.back_to_sessions")}</button>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50/60 px-4 py-1.5 rounded-full border border-blue-100/20">
                                        {editingShowtime ? t("admin.edit_movie") : t("booking.title")}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("validation.film")}</label>
                                    <select
                                        required
                                        disabled={!!editingShowtime}
                                        value={showtimeData.movieId}
                                        onChange={e => setShowtimeData(p => ({ ...p, movieId: e.target.value }))}
                                        className="w-full px-5 py-3 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/40 focus:bg-white text-xs font-medium focus:outline-none focus:border-blue-400 transition-all disabled:opacity-50 disabled:bg-slate-100/60"
                                    >
                                        <option value="">-- {t("theaters.currently_selected")} --</option>
                                        {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.year})</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("validation.cinema")}</label>
                                        <select
                                            required
                                            disabled={!!editingShowtime}
                                            value={showtimeData.theaterId}
                                            onChange={e => setShowtimeData(p => ({ ...p, theaterId: e.target.value, hallId: "" }))}
                                            className="w-full px-5 py-3 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/40 focus:bg-white text-xs font-medium focus:outline-none focus:border-blue-400 transition-all disabled:opacity-50 disabled:bg-slate-100/60"
                                        >
                                            <option value="">-- {t("common.select_city")} --</option>
                                            {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("validation.hall")}</label>
                                        <select
                                            required
                                            disabled={!!editingShowtime || !showtimeData.theaterId}
                                            value={showtimeData.hallId}
                                            onChange={e => setShowtimeData(p => ({ ...p, hallId: e.target.value }))}
                                            className="w-full px-5 py-3 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/40 focus:bg-white text-xs font-medium focus:outline-none focus:border-blue-400 transition-all disabled:opacity-50 disabled:bg-slate-100/60"
                                        >
                                            <option value="">-- {t("bookings.hall_placeholder")} --</option>
                                            {availableHalls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("validation.session")} *</label>
                                        <input required type="datetime-local" value={showtimeData.startTime} onChange={e => setShowtimeData(p => ({ ...p, startTime: e.target.value }))} className="w-full px-5 py-3 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/40 focus:bg-white text-xs focus:outline-none focus:border-blue-400 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">{t("booking.total_cost")} ({t("booking.currency")})</label>
                                        <input type="number" value={showtimeData.price} onChange={e => setShowtimeData(p => ({ ...p, price: e.target.value }))} className="w-full px-5 py-3 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/40 focus:bg-white text-xs font-bold transition-all" />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-5 border-t border-slate-50">
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-semibold shadow-sm transition-all"><Save size={14} /> {editingShowtime ? t("profile.buttons.save") : t("booking.confirm")}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-[2rem] border border-slate-100/60 shadow-sm items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 pl-2">{t("home.found_count", { count: bundledShowtimes.length })}</span>
                                    <input
                                        type="text"
                                        placeholder={t("filters.search_placeholder")}
                                        value={showtimeSearch}
                                        onChange={(e) => setShowtimeSearch(e.target.value)}
                                        className="px-4 py-2.5 text-xs rounded-xl border border-slate-200/80 focus:outline-none focus:border-blue-400 font-medium text-slate-700 w-full sm:max-w-xs transition-colors"
                                    />
                                    <button onClick={() => setIsAddingShowtime(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm shrink-0 transition-all"><Plus size={14} /> {t("booking.confirm")}</button>
                                </div>

                                {bundledShowtimes.length === 0 ? (
                                    <div className="p-14 text-center text-slate-400 font-medium bg-white rounded-[2rem] border border-slate-100/60">{t("home.not_found")}</div>
                                ) : (
                                    <div className="space-y-4">
                                        {bundledShowtimes.map((movieGroup) => {
                                            const isMovieExpanded = !!expandedMovies[movieGroup.movieId];
                                            return (
                                                <div key={movieGroup.movieId} className="bg-white rounded-[2rem] border border-slate-100/40 shadow-sm overflow-hidden transition-all">

                                                    <div onClick={() => toggleMovieExpand(movieGroup.movieId)} className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/20 select-none transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <img src={movieGroup.posterUrl || "https://via.placeholder.com/30x40"} alt="" className="w-8 h-11 rounded-lg object-cover border border-slate-100 bg-slate-50 shadow-sm" />
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 text-base">{movieGroup.title}</h4>
                                                                <span className="inline-block mt-1.5 text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2.5 py-0.5 rounded-md">
                                                                    {t("validation.seats")}: {movieGroup.dates.length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-slate-400 pr-2">{isMovieExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                                                    </div>

                                                    <AnimatePresence initial={false}>
                                                        {isMovieExpanded && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/10 border-t border-slate-50 px-5 pb-5 pt-2 space-y-3">
                                                                {movieGroup.dates.map((dateGroup) => {
                                                                    const dateKeyCombined = `${movieGroup.movieId}-${dateGroup.dateKey}`;
                                                                    const isDateExpanded = !!expandedDates[dateKeyCombined];

                                                                    return (
                                                                        <div key={dateGroup.dateKey} className="space-y-2 mt-1">
                                                                            <div onClick={() => toggleDateExpand(movieGroup.movieId, dateGroup.dateKey)} className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 tracking-wider pl-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none bg-slate-50 rounded-xl transition-colors">
                                                                                <span>{dateGroup.formattedDate} ({dateGroup.items.length})</span>
                                                                                <div className="pr-2 text-slate-400">{isDateExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</div>
                                                                            </div>

                                                                            <AnimatePresence initial={false}>
                                                                                {isDateExpanded && (
                                                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white rounded-xl border border-slate-100/50 divide-y divide-slate-50 overflow-hidden shadow-sm">
                                                                                        {dateGroup.items.map((st) => (
                                                                                            <div key={st.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-medium gap-3 hover:bg-slate-50/10 transition-colors">
                                                                                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                                                                                                    <span className="text-slate-800 font-bold min-w-[140px]">{st.hall?.theater?.name}</span>
                                                                                                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-wide">{st.hall?.name}</span>
                                                                                                    <span className="text-blue-600 font-bold bg-blue-50/70 px-2.5 py-0.5 rounded-md text-[11px] tracking-wide">
                                                                                                        {st.startTime ? new Date(st.startTime).toLocaleTimeString(currentLocale, { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                                                                                    <span className="text-slate-700 font-bold text-sm mr-2">{st.price || 120} {t("booking.currency")}</span>
                                                                                                    <button type="button" onClick={() => handleStartEditShowtime(st)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-all"><Edit2 size={13} /></button>
                                                                                                    <button type="button" onClick={() => handleActionDeleteShowtime(st)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {/* ТАБ 3: СТАТИСТИКА ТА АНАЛІТИКА */}
                    {activeTab === "stats" && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-7 rounded-[2rem] border border-slate-100/40 shadow-sm flex items-center gap-5">
                                    <div className="p-3.5 bg-emerald-50 text-emerald-500 rounded-2xl"><DollarSign size={22} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.total_revenue")}</div>
                                        <div className="text-xl font-bold text-slate-800 mt-1">{stats.revenue.toLocaleString()} {t("booking.currency")}</div>
                                    </div>
                                </div>
                                <div className="bg-white p-7 rounded-[2rem] border border-slate-100/40 shadow-sm flex items-center gap-5">
                                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl"><Ticket size={22} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.tickets_sold")}</div>
                                        <div className="text-xl font-bold text-slate-800 mt-1">{stats.ticketsSold}</div>
                                    </div>
                                </div>
                                <div className="bg-white p-7 rounded-[2rem] border border-slate-100/40 shadow-sm flex items-center gap-5">
                                    <div className="p-3.5 bg-purple-50 text-purple-500 rounded-2xl"><TrendingUp size={22} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.occupancy_rate")}</div>
                                        <div className="text-xl font-bold text-slate-800 mt-1">{stats.occupancyRate}%</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100/40 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-bold text-slate-800 text-base">{t("admin.top_movies")}</h3>
                                    <p className="text-xs text-slate-400 font-normal mt-1 tracking-wide">{t("admin.stats_title")}</p>
                                </div>

                                {isStatsLoading ? (
                                    <div className="text-center text-slate-400 py-14 text-xs font-medium animate-pulse">{t("home.updating")}</div>
                                ) : stats.topMovies.length === 0 ? (
                                    <div className="text-center text-slate-400 py-14 text-xs font-medium">{t("home.not_found")}</div>
                                ) : (
                                    <div className="space-y-6 w-full">
                                        {stats.topMovies.map((movie, index) => {
                                            const currentRevenue = movie.revenue || 0;
                                            const percent = maxRevenue > 0 ? Math.min(100, Math.max(6, (currentRevenue / maxRevenue) * 100)) : 0;

                                            return (
                                                <div key={movie.id || index} className="space-y-2.5">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                                                        <span className="tracking-wide text-slate-700 text-sm">{movie.title}</span>
                                                        <span className="text-blue-600 font-bold bg-blue-50/50 px-3 py-1 rounded-xl">
                                                            {currentRevenue.toLocaleString()} {t("booking.currency")}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100/30">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percent}%` }}
                                                            transition={{ duration: 0.9, ease: "easeOut" }}
                                                            className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ПЛАВАЮЧІ БАНЕРИ СКАСУВАННЯ ВИДАЛЕННЯ (UNDO) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 min-w-[400px]">
                    <AnimatePresence>
                        {pendingDelete && (
                            <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.98 }} className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-5 border border-slate-800 justify-between">
                                <div className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /><span className="text-xs font-medium">Removed movie <b className="text-blue-300 font-bold">«{pendingDelete.title}»</b> ({timeLeft}s)</span></div>
                                <button type="button" onClick={handleUndo} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"><Undo2 size={12} /> {t("filters.reset")}</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {pendingDeleteShowtime && (
                            <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.98 }} className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-5 border border-slate-800 justify-between">
                                <div className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /><span className="text-xs font-medium">Removed showtime <b className="text-blue-300 font-bold">«{pendingDeleteShowtime.movie?.title}»</b> ({showtimeTimeLeft}s)</span></div>
                                <button type="button" onClick={handleUndoShowtime} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"><Undo2 size={12} /> {t("filters.reset")}</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
};