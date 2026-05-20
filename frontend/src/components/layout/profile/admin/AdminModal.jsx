import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Film, BarChart3, Plus, Trash2, Edit2, TrendingUp, DollarSign, Ticket, Clock, Undo2, Save, ArrowLeft, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";

/**
 * КОМПОНЕНТ: Модальне вікно панелі адміністратора з живими графіками та ніжним UI.
 */
export const AdminModal = ({ isOpen, onClose, movies = [], genres = [], onRefresh }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("movies");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Пошукові запити
    const [movieSearch, setMovieSearch] = useState("");
    const [showtimeSearch, setShowtimeSearch] = useState("");

    // Стейти для фільмів (рейтинг повністю видалено)
    const [editingMovie, setEditingMovie] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        title: "", year: "", durationMin: "", backdropUrl: "",
        posterUrl: "", trailerUrl: "", description: "", director: ""
    });
    const [selectedGenres, setSelectedGenres] = useState([]);

    // Стейти для керування розкладом сеансів (Showtimes)
    const [showtimes, setShowtimes] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [isAddingShowtime, setIsAddingShowtime] = useState(false);
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

    // Рефи та стейти для Undo (Сеанси)
    const [pendingDeleteShowtime, setPendingDeleteShowtime] = useState(null);
    const [showtimeTimeLeft, setShowtimeTimeLeft] = useState(15);
    const showtimeDeleteTimerRef = useRef(null);
    const showtimeCountdownIntervalRef = useRef(null);

    // Фільтрація та мемоїзація списку фільмів із пошуком
    const displayedMovies = useMemo(() => {
        return movies
            .filter(m => m.id !== pendingDelete?.id)
            .filter(m => {
                if (!movieSearch) return true;
                const query = movieSearch.toLowerCase();
                return m.title?.toLowerCase().includes(query) || m.director?.toLowerCase().includes(query);
            });
    }, [movies, pendingDelete, movieSearch]);

    // Групування сеансів
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
            const movieTitle = st.movie?.title || t("admin.movies.unknown", "Невідомий фільм");
            const posterUrl = st.movie?.posterUrl || "";

            if (!movieMap[movieId]) {
                movieMap[movieId] = { movieId, title: movieTitle, posterUrl, dates: {} };
            }

            const dateKey = st.startTime ? new Date(st.startTime).toISOString().split('T')[0] : "unknown-date";

            if (!movieMap[movieId].dates[dateKey]) {
                movieMap[movieId].dates[dateKey] = {
                    dateKey,
                    formattedDate: st.startTime ? new Date(st.startTime).toLocaleDateString("uk-UA", {
                        weekday: "short", month: "long", day: "numeric"
                    }) : t("admin.showtimes.unknown_date", "Дата не вказана"),
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
    }, [showtimes, pendingDeleteShowtime, showtimeSearch, t]);

    const loadShowtimesData = async () => {
        try {
            const [stRes, thRes] = await Promise.all([
                axios.get("http://localhost:5000/api/showtimes"),
                axios.get("http://localhost:5000/api/theaters")
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
            const token = localStorage.getItem('authToken');
            const res = await axios.get("http://localhost:5000/api/movies/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
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
    }, [isOpen, activeTab]);

    const resetForm = () => {
        setFormData({
            title: "", year: "", durationMin: "", backdropUrl: "",
            posterUrl: "", trailerUrl: "", description: "", director: ""
        });
        setSelectedGenres([]);
    };

    const executeRealDelete = async (movieId) => {
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`http://localhost:5000/api/movies/${movieId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            const token = localStorage.getItem('authToken');
            await axios.delete(`http://localhost:5000/api/showtimes/${showtimeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            title: movie.title || "", year: movie.year || "", durationMin: movie.durationMin || "",
            backdropUrl: movie.backdropUrl || "", posterUrl: movie.posterUrl || "", trailerUrl: movie.trailerUrl || "",
            description: movie.description || "", director: movie.director || ""
        });
        setSelectedGenres(movie.genres ? movie.genres.map(mg => mg.genre.name) : []);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        if (selectedGenres.length === 0) {
            alert(t("admin.movies.genres_empty_error", "Обов’язково оберіть хоча б один жанр для фільму!"));
            return;
        }
        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const formattedData = {
                ...formData,
                year: formData.year ? parseInt(formData.year, 10) : undefined,
                durationMin: formData.durationMin ? parseInt(formData.durationMin, 10) : undefined,
                genres: selectedGenres
            };

            if (editingMovie) {
                await axios.put(`http://localhost:5000/api/movies/${editingMovie.id}`, formattedData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else if (isAdding) {
                await axios.post("http://localhost:5000/api/movies", formattedData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setEditingMovie(null);
            setIsAdding(false);
            resetForm();
            onRefresh?.();
        } catch (error) {
            console.error(error);
            alert("Помилка збереження даних фільму");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateShowtime = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.post("http://localhost:5000/api/showtimes", {
                movieId: showtimeData.movieId,
                hallId: showtimeData.hallId,
                startTime: showtimeData.startTime,
                price: showtimeData.price
            }, { headers: { Authorization: `Bearer ${token}` } });

            setIsAddingShowtime(false);
            setShowtimeData({ movieId: "", theaterId: "", hallId: "", startTime: "", price: "120" });
            loadShowtimesData();
        } catch (err) {
            console.error(err);
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

    const showForm = isAdding || !!editingMovie;
    const selectedTheaterObj = theaters.find(t => t.id === parseInt(showtimeData.theaterId, 10));
    const availableHalls = selectedTheaterObj ? selectedTheaterObj.halls : [];

    // Максимальне значення заробітку для розрахунку масштабу смуг графіка
    const maxRevenue = Math.max(...stats.topMovies.map(m => m.revenue || 1), 1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[6px]">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-100/80 relative"
            >
                {/* Хедер Панелі */}
                <div className="px-10 py-6 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-indigo-50/70 text-indigo-500 rounded-2xl"><Film size={20} /></div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-slate-800">{t("admin.title", "Панель адміністратора")}</h2>
                            <p className="text-xs text-slate-400 font-normal mt-0.5">{t("admin.subtitle", "Повний операційний контроль кіносистеми")}</p>
                        </div>
                    </div>
                    <button onClick={handleSafeClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"><X size={18} /></button>
                </div>

                {/* Навігація */}
                {!showForm && !isAddingShowtime && (
                    <div className="px-10 bg-slate-50/40 border-b border-slate-100/60 flex gap-6">
                        <button onClick={() => setActiveTab("movies")} className={`flex items-center gap-2 py-4 font-semibold text-xs tracking-wide uppercase border-b-2 transition-all ${activeTab === "movies" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}><Film size={14} /> {t("admin.tabs.movies", "Керування фільмами")}</button>
                        <button onClick={() => setActiveTab("showtimes")} className={`flex items-center gap-2 py-4 font-semibold text-xs tracking-wide uppercase border-b-2 transition-all ${activeTab === "showtimes" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}><Calendar size={14} /> {t("admin.tabs.showtimes", "Керування розкладом")}</button>
                        <button onClick={() => setActiveTab("stats")} className={`flex items-center gap-2 py-4 font-semibold text-xs tracking-wide uppercase border-b-2 transition-all ${activeTab === "stats" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}><BarChart3 size={14} /> {t("admin.tabs.stats", "Статистика та аналітика")}</button>
                    </div>
                )}

                {/* Основний Контент */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20">

                    {/* ТАБ 1: КЕРУВАННЯ ФІЛЬМАМИ */}
                    {activeTab === "movies" && (
                        showForm ? (
                            <form onSubmit={handleSaveForm} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 max-w-3xl mx-auto">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingMovie(null); resetForm(); }} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft size={14} /> {t("admin.form.back", "Назад до списку")}</button>
                                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50/60 px-3 py-1 rounded-full">{editingMovie ? "Редагування фільму" : "Створення картки фільму"}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Назва фільму *</label>
                                        <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm font-medium" placeholder="Наприклад, Інтерстеллар" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Режисер</label>
                                        <input type="text" name="director" value={formData.director} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm" placeholder="К. Нолан" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Рік випуску *</label>
                                        <input required type="number" name="year" value={formData.year} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm" placeholder="2014" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Тривалість (хв) *</label>
                                        <input required type="number" name="durationMin" value={formData.durationMin} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm" placeholder="169" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">Жанри (оберіть кліком) *</label>
                                    <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        {genres.map((g) => {
                                            const isSel = selectedGenres.includes(g.name);
                                            return (
                                                <button key={g.id} type="button" onClick={() => setSelectedGenres(p => p.includes(g.name) ? p.filter(n => n !== g.name) : [...p, g.name])} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${isSel ? "bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-100" : "bg-white border-slate-200/60 text-slate-500 hover:border-slate-300"}`}>{g.name}</button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Опис сюжетної лінії *</label>
                                    <textarea required rows="3" name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm resize-none" placeholder="Короткий опис фільму..." />
                                </div>
                                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all">{isSaving ? "Збереження..." : "Зберегти зміни"}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400">Усього в каталозі: {displayedMovies.length} фільмів</span>
                                    <input
                                        type="text"
                                        placeholder="Пошук за назвою або режисером..."
                                        value={movieSearch}
                                        onChange={(e) => setMovieSearch(e.target.value)}
                                        className="px-4 py-2 text-xs rounded-xl border border-slate-200/80 focus:outline-none focus:border-indigo-400 font-medium text-slate-700 w-full sm:max-w-xs transition-colors"
                                    />
                                    <button onClick={() => { setIsAdding(true); resetForm(); }} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shrink-0 transition-all"><Plus size={14} /> Додати новий фільм</button>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100"><th className="px-6 py-3.5">Фільм</th><th className="px-6 py-3.5">Жанри</th><th className="px-6 py-3.5">Тривалість</th><th className="px-6 py-3.5 text-right">Дії</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-xs">
                                        {displayedMovies.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-3 flex items-center gap-3">
                                                    <img src={m.posterUrl || "https://via.placeholder.com/40x60"} alt="" className="w-8 h-11 rounded-md object-cover shadow-sm bg-slate-100" />
                                                    <div><div className="font-bold text-slate-800">{m.title}</div><div className="text-[11px] text-slate-400 font-medium mt-0.5">{m.director || "Режисер не вказаний"}, {m.year}</div></div>
                                                </td>
                                                <td className="px-6 py-3"><div className="flex flex-wrap gap-1">{m.genres?.map(g => <span key={g.genre.id} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-md">{g.genre.name}</span>)}</div></td>
                                                <td className="px-6 py-3 text-slate-500 font-medium">{m.durationMin} хв</td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button onClick={() => handleStartEdit(m)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-lg transition-all"><Edit2 size={14} /></button>
                                                        <button disabled={isDeleting} onClick={() => handleActionDelete(m)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all"><Trash2 size={14} /></button>
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
                        isAddingShowtime ? (
                            <form onSubmit={handleCreateShowtime} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-5 max-w-xl mx-auto">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <button type="button" onClick={() => setIsAddingShowtime(false)} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft size={14} /> Назад</button>
                                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50/60 px-3 py-1 rounded-full">Планування сеансу</span>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Оберіть Фільм зі списку *</label>
                                    <select required value={showtimeData.movieId} onChange={e => setShowtimeData(p => ({ ...p, movieId: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/50 focus:bg-white text-xs font-medium focus:outline-none focus:border-indigo-400 transition-all">
                                        <option value="">-- Виберіть кінострічку --</option>
                                        {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.year})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Кінотеатр *</label>
                                        <select required value={showtimeData.theaterId} onChange={e => setShowtimeData(p => ({ ...p, theaterId: e.target.value, hallId: "" }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/50 focus:bg-white text-xs font-medium focus:outline-none focus:border-indigo-400 transition-all">
                                            <option value="">-- Оберіть локацію --</option>
                                            {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Кінозал *</label>
                                        <select required disabled={!showtimeData.theaterId} value={showtimeData.hallId} onChange={e => setShowtimeData(p => ({ ...p, hallId: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/50 focus:bg-white text-xs font-medium focus:outline-none focus:border-indigo-400 transition-all disabled:opacity-40">
                                            <option value="">-- Оберіть зал --</option>
                                            {availableHalls.map(h => <option key={h.id} value={h.id}>{h.name} ({h.type || "2D/3D"})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Дата та Час Початку *</label>
                                        <input required type="datetime-local" value={showtimeData.startTime} onChange={e => setShowtimeData(p => ({ ...p, startTime: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/50 focus:bg-white text-xs focus:outline-none focus:border-indigo-400 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">Ціна квитка (₴)</label>
                                        <input type="number" value={showtimeData.price} onChange={e => setShowtimeData(p => ({ ...p, price: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 text-slate-700 bg-slate-50/50 focus:bg-white text-xs font-bold transition-all" />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"><Save size={14} /> Створити сеанс</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400">Активний розклад: {bundledShowtimes.length} фільм(ів)</span>
                                    <input
                                        type="text"
                                        placeholder="Шукати фільм або кінотеатр у розкладі..."
                                        value={showtimeSearch}
                                        onChange={(e) => setShowtimeSearch(e.target.value)}
                                        className="px-4 py-2 text-xs rounded-xl border border-slate-200/80 focus:outline-none focus:border-indigo-400 font-medium text-slate-700 w-full sm:max-w-xs transition-colors"
                                    />
                                    <button onClick={() => setIsAddingShowtime(true)} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shrink-0 transition-all"><Plus size={14} /> Створити новий сеанс</button>
                                </div>

                                {bundledShowtimes.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-100">Сеансів за вказаними критеріями не знайдено.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {bundledShowtimes.map((movieGroup) => {
                                            const isMovieExpanded = !!expandedMovies[movieGroup.movieId];
                                            return (
                                                <div key={movieGroup.movieId} className="bg-white rounded-2xl border border-slate-100/70 shadow-sm overflow-hidden transition-all">

                                                    {/* Рівень 1: Фільм */}
                                                    <div onClick={() => toggleMovieExpand(movieGroup.movieId)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/40 select-none transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <img src={movieGroup.posterUrl || "https://via.placeholder.com/30x40"} alt="" className="w-7 h-10 rounded-md object-cover border bg-slate-50" />
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 text-sm">{movieGroup.title}</h4>
                                                                <span className="inline-block mt-1 text-[10px] font-medium text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                                                                    Днів із запланованими сеансами: {movieGroup.dates.length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-slate-400">{isMovieExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                                                    </div>

                                                    {/* Рівень 2: Дати всередині фільму */}
                                                    <AnimatePresence initial={false}>
                                                        {isMovieExpanded && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/20 border-t border-slate-50 px-4 pb-4 pt-1 space-y-2.5">
                                                                {movieGroup.dates.map((dateGroup) => {
                                                                    const dateKeyCombined = `${movieGroup.movieId}-${dateGroup.dateKey}`;
                                                                    const isDateExpanded = !!expandedDates[dateKeyCombined];

                                                                    return (
                                                                        <div key={dateGroup.dateKey} className="space-y-1.5 mt-2">
                                                                            <div onClick={() => toggleDateExpand(movieGroup.movieId, dateGroup.dateKey)} className="text-[10px] font-semibold uppercase text-slate-400 hover:text-slate-600 tracking-wider pl-2.5 py-2 flex items-center justify-between cursor-pointer select-none bg-slate-50 rounded-xl transition-colors">
                                                                                <span>{dateGroup.formattedDate} ({dateGroup.items.length} сеанс.)</span>
                                                                                <div className="pr-1.5 text-slate-400">{isDateExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</div>
                                                                            </div>

                                                                            {/* Рівень 3: Список конкретних сеансів */}
                                                                            <AnimatePresence initial={false}>
                                                                                {isDateExpanded && (
                                                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white rounded-xl border border-slate-100/70 divide-y divide-slate-50 overflow-hidden shadow-2xl shadow-slate-100/40">
                                                                                        {dateGroup.items.map((st) => (
                                                                                            <div key={st.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-medium gap-2 hover:bg-slate-50/30 transition-colors">
                                                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                                                                    <span className="text-slate-800 font-bold min-w-[130px]">{st.hall?.theater?.name}</span>
                                                                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-400 uppercase tracking-wide">{st.hall?.name}</span>
                                                                                                    <span className="text-indigo-500 font-bold bg-indigo-50/60 px-2 py-0.5 rounded-md text-[11px] tracking-wide">
                                                                                                        {st.startTime ? new Date(st.startTime).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between sm:justify-end gap-5">
                                                                                                    <span className="text-slate-700 font-bold">{st.price || 120} ₴</span>
                                                                                                    <button type="button" onClick={() => handleActionDeleteShowtime(st)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13} /></button>
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

                    {/* ТАБ 3: СТАТИСТИКА ТА АНАЛІТИКА (ЖИВІ ГРАФІКИ) */}
                    {activeTab === "stats" && (
                        <div className="space-y-8">
                            {/* Картки метрик */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="bg-white p-6 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><DollarSign size={22} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Касові збори</div>
                                        <div className="text-lg font-bold text-slate-800 mt-0.5">{stats.revenue.toLocaleString()} ₴</div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><Ticket size={22} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Продано квитків</div>
                                        <div className="text-lg font-bold text-slate-800 mt-0.5">{stats.ticketsSold} од.</div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl"><TrendingUp size={22} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Заповнюваність залів</div>
                                        <div className="text-lg font-bold text-slate-800 mt-0.5">{stats.occupancyRate}%</div>
                                    </div>
                                </div>
                            </div>

                            {/* Кастомний графік на всю ширину */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-bold text-slate-800 text-sm">Касові збори за фільмами</h3>
                                    <p className="text-xs text-slate-400 font-normal mt-0.5">Загальна фінансова виручка від продажу квитків на кожну стрічку</p>
                                </div>

                                {isStatsLoading ? (
                                    <div className="text-center text-slate-400 py-12 text-xs font-medium animate-pulse">Оновлення аналітичних даних з сервера...</div>
                                ) : stats.topMovies.length === 0 ? (
                                    <div className="text-center text-slate-400 py-12 text-xs font-medium">Дані про касові збори наразі відсутні.</div>
                                ) : (
                                    <div className="space-y-5 w-full">
                                        {stats.topMovies.map((movie, index) => {
                                            const currentRevenue = movie.revenue || 0;
                                            const percent = maxRevenue > 0 ? Math.min(100, Math.max(6, (currentRevenue / maxRevenue) * 100)) : 0;

                                            return (
                                                <div key={movie.id || index} className="space-y-2">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                                                        <span className="tracking-wide text-slate-700">{movie.title}</span>
                                                        <span className="text-indigo-500 font-bold bg-indigo-50/40 px-2.5 py-0.5 rounded-lg">
                                                            {currentRevenue.toLocaleString()} ₴
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-3.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/30">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percent}%` }}
                                                            transition={{ duration: 0.9, ease: "easeOut" }}
                                                            className="h-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-500 rounded-full shadow-inner"
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
                                <div className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /><span className="text-xs font-medium">Вилучено фільм <b className="text-indigo-300 font-bold">«{pendingDelete.title}»</b> ({timeLeft}с)</span></div>
                                <button type="button" onClick={handleUndo} className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"><Undo2 size={12} /> Відновити</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {pendingDeleteShowtime && (
                            <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.98 }} className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-5 border border-slate-800 justify-between">
                                <div className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /><span className="text-xs font-medium">Вилучено сеанс фільму <b className="text-indigo-300 font-bold">«{pendingDeleteShowtime.movie?.title}»</b> ({showtimeTimeLeft}с)</span></div>
                                <button type="button" onClick={handleUndoShowtime} className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"><Undo2 size={12} /> Відновити</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
};