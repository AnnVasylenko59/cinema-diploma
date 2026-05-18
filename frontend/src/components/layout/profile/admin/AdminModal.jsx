import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Film, BarChart3, Plus, Trash2, Edit2, TrendingUp, DollarSign, Ticket, Clock, Undo2, Save, ArrowLeft, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";

/**
 * КОМПОНЕНТ: Модальне вікно панелі адміністратора з пошуком та подвійним Undo розкладу.
 * @param {Object} props - Пропси компонента.
 * @param {boolean} props.isOpen - Статус видимості.
 * @param {Function} props.onClose - Закриття вікна.
 * @param {Array} props.movies - Масив актуальних фільмів.
 * @param {Array} props.genres - Масив глобальних жанрів.
 * @param {Function} props.onRefresh - Функція для рефрешу списку фільмів.
 * @returns {React.JSX.Element|null} Елемент інтерфейсу або null.
 */
export const AdminModal = ({ isOpen, onClose, movies = [], genres = [], onRefresh }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("movies");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Пошукові запити
    const [movieSearch, setMovieSearch] = useState("");
    const [showtimeSearch, setShowtimeSearch] = useState("");

    // Стейти для фільмів
    const [editingMovie, setEditingMovie] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        title: "", year: "", durationMin: "", backdropUrl: "",
        posterUrl: "", trailerUrl: "", description: "", rating: "", director: ""
    });
    const [selectedGenres, setSelectedGenres] = useState([]);

    // Стейти для керування розкладом сеансів (Showtimes)
    const [showtimes, setShowtimes] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [isAddingShowtime, setIsAddingShowtime] = useState(false);
    const [showtimeData, setShowtimeData] = useState({
        movieId: "", theaterId: "", hallId: "", startTime: "", price: "120"
    });

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

    // ГЛИБОКЕ ДВОХРІВНЕВЕ ГРУПУВАННЯ СЕАНСІВ + ПОШУК
    const bundledShowtimes = useMemo(() => {
        const movieMap = {};

        const filteredShowtimes = showtimes.filter(st => {
            if (pendingDeleteShowtime && st.id === pendingDeleteShowtime.id) return false;
            if (!showtimeSearch) return true;
            const query = showtimeSearch.toLowerCase();
            const titleMatch = st.movie?.title?.toLowerCase().includes(query);
            const theaterMatch = st.hall?.theater?.name?.toLowerCase().includes(query);
            return titleMatch || theaterMatch;
        });

        filteredShowtimes.forEach((st) => {
            const movieId = st.movieId || st.movie?.id || "unknown";
            const movieTitle = st.movie?.title || t("admin.movies.unknown", "Невідомий фільм");
            const posterUrl = st.movie?.posterUrl || "";

            if (!movieMap[movieId]) {
                movieMap[movieId] = {
                    movieId,
                    title: movieTitle,
                    posterUrl,
                    dates: {}
                };
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
            sortedDates.forEach(dateGroup => {
                dateGroup.items.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            });
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

    useEffect(() => {
        if (isOpen && activeTab === "showtimes") {
            loadShowtimesData();
        }
    }, [isOpen, activeTab]);

    const resetForm = () => {
        setFormData({
            title: "", year: "", durationMin: "", backdropUrl: "",
            posterUrl: "", trailerUrl: "", description: "", rating: "", director: ""
        });
        setSelectedGenres([]);
    };

    // Фінальне видалення фільму
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
            alert("Помилка при видаленні фільму");
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

    // Фінальне видалення сеансу
    const executeRealDeleteShowtime = async (showtimeId) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`http://localhost:5000/api/showtimes/${showtimeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadShowtimesData();
        } catch (error) {
            console.error(error);
            alert("Помилка при видаленні сеансу");
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
            description: movie.description || "", rating: movie.rating || "", director: movie.director || ""
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
                rating: formData.rating ? parseFloat(formData.rating) : null,
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
            alert("Помилка при створенні сеансу");
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
        if (pendingDelete) {
            clearTimeout(deleteTimerRef.current);
            clearInterval(countdownIntervalRef.current);
            executeRealDelete(pendingDelete.id);
        }
        if (pendingDeleteShowtime) {
            clearTimeout(showtimeDeleteTimerRef.current);
            clearInterval(showtimeCountdownIntervalRef.current);
            executeRealDeleteShowtime(pendingDeleteShowtime.id);
        }
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-gray-100 relative"
            >
                {/* Хедер */}
                <div className="px-8 py-5 bg-white text-gray-900 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Film size={20} /></div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-gray-900">{t("admin.title", "Панель адміністратора")}</h2>
                            <p className="text-xs text-gray-400 font-medium">{t("admin.subtitle", "Повний операційний контроль кіносистеми")}</p>
                        </div>
                    </div>
                    <button onClick={handleSafeClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"><X size={20} /></button>
                </div>

                {/* Навігація */}
                {!showForm && !isAddingShowtime && (
                    <div className="px-8 bg-gray-50/50 border-b border-gray-100 flex gap-4">
                        <button onClick={() => setActiveTab("movies")} className={`flex items-center gap-2 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === "movies" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}><Film size={16} /> {t("admin.tabs.movies", "Керування фільмами")}</button>
                        <button onClick={() => setActiveTab("showtimes")} className={`flex items-center gap-2 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === "showtimes" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}><Calendar size={16} /> {t("admin.tabs.showtimes", "Керування розкладом")}</button>
                        <button onClick={() => setActiveTab("stats")} className={`flex items-center gap-2 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === "stats" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}><BarChart3 size={16} /> {t("admin.tabs.stats", "Статистика та аналітика")}</button>
                    </div>
                )}

                {/* Контент */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                    {/* ТАБ 1: ФІЛЬМИ */}
                    {activeTab === "movies" && (
                        showForm ? (
                            <form onSubmit={handleSaveForm} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 max-w-4xl mx-auto">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                    <button type="button" onClick={() => { setIsAdding(false); setEditingMovie(null); resetForm(); }} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900"><ArrowLeft size={16} /> {t("admin.form.back", "Назад")}</button>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Назва фільму *</label>
                                    <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Режисер</label>
                                        <input type="text" name="director" value={formData.director} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Рік *</label>
                                        <input required type="number" name="year" value={formData.year} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Тривалість (хв) *</label>
                                        <input required type="number" name="durationMin" value={formData.durationMin} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Рейтинг</label>
                                        <input type="number" step="0.1" name="rating" value={formData.rating} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-3">Жанри (оберіть кліком) *</label>
                                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                        {genres.map((g) => {
                                            const isSel = selectedGenres.includes(g.name);
                                            return (
                                                <button key={g.id} type="button" onClick={() => setSelectedGenres(p => p.includes(g.name) ? p.filter(n => n !== g.name) : [...p, g.name])} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSel ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-600"}`}>{g.name}</button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Опис *</label>
                                    <textarea required rows="3" name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none" />
                                </div>
                                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md">{isSaving ? "Збереження..." : "Зберегти"}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                {/* РЯДОК ПОШУКУ ФІЛЬМІВ */}
                                <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm items-center justify-between">
                                    <span className="text-sm font-bold text-gray-500">Усього фільмів: {displayedMovies.length}</span>
                                    <input
                                        type="text"
                                        placeholder="Пошук фільму за назвою чи режисером..."
                                        value={movieSearch}
                                        onChange={(e) => setMovieSearch(e.target.value)}
                                        className="px-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-gray-900 w-full sm:max-w-xs"
                                    />
                                    <button onClick={() => { setIsAdding(true); resetForm(); }} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shrink-0"><Plus size={14} /> Додати фільм</button>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase border-b border-gray-100"><th className="px-6 py-3">Фільм</th><th className="px-6 py-3">Жанри</th><th className="px-6 py-3">Тривалість</th><th className="px-6 py-3 text-right">Дії</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-sm">
                                        {displayedMovies.map((m) => (
                                            <tr key={m.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-3 flex items-center gap-3">
                                                    <img src={m.posterUrl || "https://via.placeholder.com/40x60"} alt="" className="w-9 h-12 rounded-lg object-cover" />
                                                    <div><div className="font-black text-gray-900">{m.title}</div><div className="text-xs text-gray-400 font-medium">{m.director}, {m.year}</div></div>
                                                </td>
                                                <td className="px-6 py-3"><div className="flex flex-wrap gap-1">{m.genres?.map(g => <span key={g.genre.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">{g.genre.name}</span>)}</div></td>
                                                <td className="px-6 py-3 text-gray-500 font-medium">{m.durationMin} хв</td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleStartEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 size={15} /></button>
                                                        <button disabled={isDeleting} onClick={() => handleActionDelete(m)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
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

                    {/* ТАБ 2: АКОРДЕОН РОЗКЛАДУ */}
                    {activeTab === "showtimes" && (
                        isAddingShowtime ? (
                            <form onSubmit={handleCreateShowtime} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 max-w-xl mx-auto">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                    <button type="button" onClick={() => setIsAddingShowtime(false)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900"><ArrowLeft size={16} /> Назад</button>
                                    <h3 className="font-black text-gray-900 text-base">Новий сеанс</h3>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Оберіть Фільм *</label>
                                    <select required value={showtimeData.movieId} onChange={e => setShowtimeData(p => ({ ...p, movieId: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 font-medium text-gray-900">
                                        <option value="">-- Оберіть фільм зі списку --</option>
                                        {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.year})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Кінотеатр *</label>
                                        <select required value={showtimeData.theaterId} onChange={e => setShowtimeData(p => ({ ...p, theaterId: e.target.value, hallId: "" }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 font-medium text-gray-900">
                                            <option value="">-- Кінотеатр --</option>
                                            {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Кінозал *</label>
                                        <select required disabled={!showtimeData.theaterId} value={showtimeData.hallId} onChange={e => setShowtimeData(p => ({ ...p, hallId: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 font-medium text-gray-900 disabled:opacity-50">
                                            <option value="">-- Оберіть зал --</option>
                                            {availableHalls.map(h => <option key={h.id} value={h.id}>{h.name} ({h.type || "2D/3D"})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Дата та Час *</label>
                                        <input required type="datetime-local" value={showtimeData.startTime} onChange={e => setShowtimeData(p => ({ ...p, startTime: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 bg-gray-50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Ціна квитка (₴)</label>
                                        <input type="number" value={showtimeData.price} onChange={e => setShowtimeData(p => ({ ...p, price: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 bg-gray-50" />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md"><Save size={15} /> Створити сеанс</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                {/* РЯДОК ПОШУКУ РОЗКЛАДУ */}
                                <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm items-center justify-between">
                                    <span className="text-sm font-bold text-gray-500">Афіша розкладу: {bundledShowtimes.length} фільм(ів)</span>
                                    <input
                                        type="text"
                                        placeholder="Пошук за назвою фільму чи кінотеатру..."
                                        value={showtimeSearch}
                                        onChange={(e) => setShowtimeSearch(e.target.value)}
                                        className="px-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 font-medium text-gray-900 w-full sm:max-w-xs"
                                    />
                                    <button onClick={() => setIsAddingShowtime(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shrink-0"><Plus size={14} /> Додати сеанс</button>
                                </div>

                                {bundledShowtimes.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 font-medium bg-white rounded-2xl border border-gray-100">Нічого не знайдено.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {bundledShowtimes.map((movieGroup) => {
                                            const isMovieExpanded = !!expandedMovies[movieGroup.movieId];
                                            return (
                                                <div key={movieGroup.movieId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">

                                                    {/* ЛЕВЕЛ 1: ФІЛЬМ */}
                                                    <div
                                                        onClick={() => toggleMovieExpand(movieGroup.movieId)}
                                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/70 select-none transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <img src={movieGroup.posterUrl || "https://via.placeholder.com/30x40"} alt="" className="w-8 h-11 rounded-md object-cover shadow-sm border bg-gray-50" />
                                                            <div>
                                                                <h4 className="font-black text-gray-950 text-sm leading-none">{movieGroup.title}</h4>
                                                                <span className="inline-block mt-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                                    Днів з сеансами: {movieGroup.dates.length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-gray-400">
                                                            {isMovieExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                        </div>
                                                    </div>

                                                    {/* ВМІСТ (СПИСОК ДАТ) */}
                                                    <AnimatePresence initial={false}>
                                                        {isMovieExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                                className="bg-gray-50/30 border-t border-gray-50 px-4 pb-4 pt-1 space-y-3"
                                                            >
                                                                {movieGroup.dates.map((dateGroup) => {
                                                                    const dateKeyCombined = `${movieGroup.movieId}-${dateGroup.dateKey}`;
                                                                    const isDateExpanded = !!expandedDates[dateKeyCombined];

                                                                    return (
                                                                        <div key={dateGroup.dateKey} className="space-y-1.5 mt-2">

                                                                            {/* ЛЕВЕЛ 2: ДЕНЬ */}
                                                                            <div
                                                                                onClick={() => toggleDateExpand(movieGroup.movieId, dateGroup.dateKey)}
                                                                                className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-700 tracking-widest pl-2 py-1.5 flex items-center justify-between cursor-pointer select-none bg-gray-100/50 rounded-lg transition-colors"
                                                                            >
                                                                                <span>{dateGroup.formattedDate} ({dateGroup.items.length})</span>
                                                                                <div className="pr-1 text-gray-400">
                                                                                    {isDateExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                                                </div>
                                                                            </div>

                                                                            {/* ЛЕВЕЛ 3: СЕАНСИ */}
                                                                            <AnimatePresence initial={false}>
                                                                                {isDateExpanded && (
                                                                                    <motion.div
                                                                                        initial={{ height: 0, opacity: 0 }}
                                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                                        exit={{ height: 0, opacity: 0 }}
                                                                                        transition={{ duration: 0.15, ease: "easeInOut" }}
                                                                                        className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm"
                                                                                    >
                                                                                        {dateGroup.items.map((st) => (
                                                                                            <div key={st.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-2 hover:bg-gray-50/40 transition-colors">
                                                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                                                                    <span className="text-gray-950 font-black min-w-[140px]">{st.hall?.theater?.name}</span>
                                                                                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-black text-gray-500 uppercase tracking-wider">
                                                                                                        {st.hall?.name}
                                                                                                    </span>
                                                                                                    <span className="text-blue-600 font-black bg-blue-50/80 px-2 py-0.5 rounded text-[11px]">
                                                                                                        {st.startTime ? new Date(st.startTime).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between sm:justify-end gap-4">
                                                                                                    <span className="text-gray-900 font-black">{st.price || 120} ₴</span>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => handleActionDeleteShowtime(st)}
                                                                                                        className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all active:scale-90"
                                                                                                        title="Видалити сеанс"
                                                                                                    >
                                                                                                        <Trash2 size={13} />
                                                                                                    </button>
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

                    {/* ТАБ 3: СТАТИСТИКА */}
                    {activeTab === "stats" && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign size={24} /></div>
                                    <div><div className="text-xs font-bold text-gray-400 uppercase">Касові збору</div><div className="text-xl font-black text-gray-900 mt-0.5">45,200 ₴</div></div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Ticket size={24} /></div>
                                    <div><div className="text-xs font-bold text-gray-400 uppercase">Продано квитків</div><div className="text-xl font-black text-gray-900 mt-0.5">342</div></div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={24} /></div>
                                    <div><div className="text-xs font-bold text-gray-400 uppercase">Заповнюваність залів</div><div className="text-xl font-black text-gray-900 mt-0.5">68%</div></div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="font-black text-gray-900 mb-4">Топ фільмів за популярністю</h3>
                                <div className="text-center text-gray-400 py-8 font-medium">Графіки завантажуються...</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ПЛАВАЮЧІ БАНЕРИ СКАСУВАННЯ ВИДАЛЕННЯ (UNDO) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 min-w-[420px]">
                    <AnimatePresence>
                        {pendingDelete && (
                            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-6 border border-gray-800 justify-between">
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-sm font-medium">Видалено фільм <b className="text-blue-400 font-black">«{pendingDelete.title}»</b> ({timeLeft}с)</span></div>
                                <button type="button" onClick={handleUndo} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"><Undo2 size={14} /> Відновити</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {pendingDeleteShowtime && (
                            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-6 border border-gray-800 justify-between">
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-sm font-medium">Видалено сеанс фільму <b className="text-blue-400 font-black">«{pendingDeleteShowtime.movie?.title}»</b> ({showtimeTimeLeft}с)</span></div>
                                <button type="button" onClick={handleUndoShowtime} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"><Undo2 size={14} /> Відновити</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
};