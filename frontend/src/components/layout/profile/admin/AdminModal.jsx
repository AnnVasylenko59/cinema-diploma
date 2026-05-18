import React, { useState, useEffect, useRef } from "react";
import { X, Film, BarChart3, Plus, Trash2, Edit2, TrendingUp, DollarSign, Ticket, Clock, Undo2, Save, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";

/**
 * КОМПОНЕНТ: Модальне вікно панелі адміністратора з функціями Undo Delete та повного редагування.
 * @param {Object} props - Пропси компонента.
 * @param {boolean} props.isOpen - Статус видимості.
 * @param {Function} props.onClose - Закриття вікна.
 * @param {Array} props.movies - Масив актуальних фільмів.
 * @param {Function} props.onRefresh - Функція для рефрешу списку фільмів.
 * @returns {React.JSX.Element|null} Елемент інтерфейсу або null.
 */
export const AdminModal = ({ isOpen, onClose, movies = [], onRefresh }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("movies");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Стейти для режиму редагування
    const [editingMovie, setEditingMovie] = useState(null);
    const [formData, setFormData] = useState({
        title: "", year: "", durationMin: "", backdropUrl: "",
        posterUrl: "", trailerUrl: "", description: "", rating: "", director: "", genres: ""
    });

    // Стейти для механізму скасування видалення (Undo)
    const [pendingDelete, setPendingDelete] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);

    const deleteTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    // Функція фінального видалення на сервері
    const executeRealDelete = async (movieId) => {
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`http://localhost:5000/api/movies/${movieId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh?.();
        } catch (error) {
            console.error("Delete error:", error);
            alert(error.response?.data?.error || "Помилка при остаточному видаленні фільму");
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

    // Ініціалізація форми даними обраного фільму
    const handleStartEdit = (movie) => {
        setEditingMovie(movie);
        setFormData({
            title: movie.title || "",
            year: movie.year || "",
            durationMin: movie.durationMin || "",
            backdropUrl: movie.backdropUrl || "",
            posterUrl: movie.posterUrl || "",
            trailerUrl: movie.trailerUrl || "",
            description: movie.description || "",
            rating: movie.rating || "",
            director: movie.director || "",
            genres: movie.genres ? movie.genres.map(mg => mg.genre.name).join(", ") : ""
        });
    };

    // Обробник зміни полів форми
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Сабміт оновлених даних на сервер
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken');

            // Форматування даних (числа та масив жанрів) перед відправкою
            const formattedData = {
                ...formData,
                year: formData.year ? parseInt(formData.year, 10) : undefined,
                durationMin: formData.durationMin ? parseInt(formData.durationMin, 10) : undefined,
                rating: formData.rating ? parseFloat(formData.rating) : null,
                genres: formData.genres ? formData.genres.split(",").map(g => g.trim()).filter(Boolean) : []
            };

            await axios.put(`http://localhost:5000/api/movies/${editingMovie.id}`, formattedData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(t("admin.movies.edit_success", "Дані фільму успішно оновлено!"));
            setEditingMovie(null);
            onRefresh?.();
        } catch (error) {
            console.error("Update error:", error);
            alert(error.response?.data?.error || "Помилка при збереженні змін фільму");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSafeClose = () => {
        if (pendingDelete) {
            clearTimeout(deleteTimerRef.current);
            clearInterval(countdownIntervalRef.current);
            executeRealDelete(pendingDelete.id);
        }
        onClose();
    };

    useEffect(() => {
        return () => {
            clearTimeout(deleteTimerRef.current);
            clearInterval(countdownIntervalRef.current);
        };
    }, []);

    if (!isOpen) return null;

    const displayedMovies = movies.filter(m => m.id !== pendingDelete?.id);

    const mockStats = {
        totalRevenue: "45,200 ₴",
        ticketsSold: 342,
        occupancyRate: "68%",
    };

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
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Film size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-gray-900">
                                {editingMovie ? t("admin.title.edit", "Редагування фільму") : t("admin.title", "Панель адміністратора")}
                            </h2>
                            <p className="text-xs text-gray-400 font-medium">
                                {editingMovie ? `${t("admin.subtitle.editing", "Зміна параметрів для:")} ${editingMovie.title}` : t("admin.subtitle", "Керування кінотеатром та аналітика")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSafeClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 active:scale-95 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Таби відображаються лише якщо ми не в режимі редагування */}
                {!editingMovie && (
                    <div className="px-8 bg-gray-50/50 border-b border-gray-100 flex gap-4">
                        <button
                            onClick={() => setActiveTab("movies")}
                            className={`flex items-center gap-2 py-4 font-bold text-sm border-b-2 transition-all ${
                                activeTab === "movies" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            <Film size={16} /> {t("admin.tabs.movies", "Керування фільмами")}
                        </button>
                        <button
                            onClick={() => setActiveTab("stats")}
                            className={`flex items-center gap-2 py-4 font-bold text-sm border-b-2 transition-all ${
                                activeTab === "stats" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            <BarChart3 size={16} /> {t("admin.tabs.stats", "Статистика та аналітика")}
                        </button>
                    </div>
                )}

                {/* Основний блок контенту */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                    {editingMovie ? (
                        /* ФОРМА РЕДАГУВАННЯ ФІЛЬМУ */
                        <form onSubmit={handleSaveEdit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingMovie(null)}
                                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft size={16} /> {t("admin.form.back", "Назад до списку")}
                                </button>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md uppercase tracking-wider">ID: {editingMovie.id}</span>
                            </div>

                            {/* Рядок 1: Назва фільму */}
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.title", "Назва фільму *")}</label>
                                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 font-bold text-gray-900 text-sm bg-gray-50/30 transition-all" />
                            </div>

                            {/* Рядок 2: Режисер, Рік, Тривалість, Рейтинг */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.director", "Режисер")}</label>
                                    <input type="text" name="director" value={formData.director} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-sm font-medium text-gray-900 bg-gray-50/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.year", "Рік випуску *")}</label>
                                    <input required type="number" name="year" value={formData.year} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-sm font-medium text-gray-900 bg-gray-50/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.duration", "Тривалість (хв) *")}</label>
                                    <input required type="number" name="durationMin" value={formData.durationMin} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-sm font-medium text-gray-900 bg-gray-50/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.rating", "Рейтинг")}</label>
                                    <input type="number" step="0.1" min="0" max="10" name="rating" value={formData.rating} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-sm font-medium text-gray-900 bg-gray-50/30" />
                                </div>
                            </div>

                            {/* Рядок 3: Медіа URL посилання */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.poster", "Посилання на постер (Poster URL)")}</label>
                                    <input type="text" name="posterUrl" value={formData.posterUrl} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-xs font-medium text-gray-600 bg-gray-50/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.backdrop", "Посилання на бекдроп (Backdrop URL)")}</label>
                                    <input type="text" name="backdropUrl" value={formData.backdropUrl} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-xs font-medium text-gray-600 bg-gray-50/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.trailer", "Посилання на трейлер YouTube (Trailer URL)")}</label>
                                    <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-xs font-medium text-gray-600 bg-gray-50/30" />
                                </div>
                            </div>

                            {/* Рядок 4: Жанри */}
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.genres", "Жанри (через кому)")}</label>
                                <input type="text" name="genres" value={formData.genres} onChange={handleInputChange} placeholder="Екшн, Драма, Фантастика" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-sm font-bold text-gray-700 bg-gray-50/30" />
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">{t("admin.form.genres_tip", "Вводьте назви жанрів українською мовою, розділяючи їх комами.")}</p>
                            </div>

                            {/* Рядок 5: Опис фільму */}
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-2">{t("admin.form.description", "Опис фільму *")}</label>
                                <textarea required rows="4" name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 text-sm font-medium text-gray-900 bg-gray-50/30 resize-none" />
                            </div>

                            {/* Кнопки збереження форми */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                                <button type="button" onClick={() => setEditingMovie(null)} className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-all active:scale-95">
                                    {t("admin.form.cancel", "Скасувати")}
                                </button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-all active:scale-95 disabled:opacity-50">
                                    <Save size={16} /> {isSaving ? t("admin.form.saving", "Збереження...") : t("admin.form.save", "Зберегти зміни")}
                                </button>
                            </div>
                        </form>
                    ) : activeTab === "movies" ? (
                        /* ТАБЛИЦЯ СПИСКУ ФІЛЬМІВ */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-sm font-bold text-gray-500">
                                    {t("admin.movies.count", "Усього фільмів:")} {displayedMovies.length}
                                </span>
                                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-all">
                                    <Plus size={16} /> {t("admin.movies.add", "Додати фільм")}
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {displayedMovies.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 font-medium">
                                        {t("admin.movies.empty", "Фільми відсутні в базі даних.")}
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                        <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="px-6 py-4">{t("admin.table.movie", "Фільм")}</th>
                                            <th className="px-6 py-4">{t("admin.table.genres", "Жанри")}</th>
                                            <th className="px-6 py-4">{t("admin.table.duration", "Тривалість")}</th>
                                            <th className="px-6 py-4 text-right">{t("admin.table.actions", "Дії")}</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-sm">
                                        {displayedMovies.map((movie) => (
                                            <tr key={movie.id} className="hover:bg-gray-50/40 transition-colors">
                                                <td className="px-6 py-4 flex items-center gap-4">
                                                    <img
                                                        src={movie.posterUrl || "https://via.placeholder.com/40x60"}
                                                        alt={movie.title}
                                                        className="w-10 h-14 rounded-lg object-cover shadow-sm border border-gray-100"
                                                    />
                                                    <div>
                                                        <div className="font-black text-gray-900 leading-snug">{movie.title}</div>
                                                        <div className="text-xs text-gray-400 font-medium mt-0.5">{movie.director || "—"}, {movie.year}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {movie.genres?.map(mg => (
                                                            <span key={mg.genre.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-md">
                                                                    {mg.genre.name}
                                                                </span>
                                                        )) || "—"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} className="text-gray-400" />
                                                        {movie.durationMin} {t("admin.table.min", "хв")}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStartEdit(movie)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                            title={t("admin.actions.edit", "Редагувати")}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            disabled={isDeleting}
                                                            onClick={() => handleActionDelete(movie)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                                                            title={t("admin.actions.delete", "Видалити")}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ВКЛАДКА СТАТИСТИКИ */
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign size={24} /></div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase">{t("admin.stats.revenue", "Касові збори")}</div>
                                        <div className="text-xl font-black text-gray-900 mt-0.5">{mockStats.totalRevenue}</div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Ticket size={24} /></div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase">{t("admin.stats.tickets", "Продано квитків")}</div>
                                        <div className="text-xl font-black text-gray-900 mt-0.5">{mockStats.ticketsSold}</div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={24} /></div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase">{t("admin.stats.occupancy", "Заповнюваність залів")}</div>
                                        <div className="text-xl font-black text-gray-900 mt-0.5">{mockStats.occupancyRate}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="font-black text-gray-900 mb-4">{t("admin.stats.popular", "Топ фільмів за популярністю")}</h3>
                                <div className="text-center text-gray-400 py-8 font-medium">
                                    {t("admin.stats.chart_placeholder", "Графіки завантажуються...")}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ПЛАВАЮЧИЙ БАНЕР UNDO */}
                <AnimatePresence>
                    {pendingDelete && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-6 border border-gray-800 z-50 min-w-[400px] justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-sm font-medium">
                                    Видалено фільм <b className="text-blue-400 font-black">«{pendingDelete.title}»</b> ({timeLeft}с)
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleUndo}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-blue-500/20"
                            >
                                <Undo2 size={14} /> {t("admin.actions.undo", "Відновити")}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};