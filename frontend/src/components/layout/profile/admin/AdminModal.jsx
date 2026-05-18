import React, { useState, useEffect, useRef } from "react";
import { X, Film, BarChart3, Plus, Trash2, Edit2, TrendingUp, DollarSign, Ticket, Clock, Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";

/**
 * КОМПОНЕНТ: Модальне вікно панелі адміністратора з функцією "Undo Delete" (15 сек).
 */
export const AdminModal = ({ isOpen, onClose, movies = [], onRefresh }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("movies");
    const [isDeleting, setIsDeleting] = useState(false);

    // Стейти для механізму скасування видалення (Undo)
    const [pendingDelete, setPendingDelete] = useState(null); // Зберігає об'єкт фільму, який "у черзі"
    const [timeLeft, setTimeLeft] = useState(15); // Зворотний відлік

    const deleteTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    // Функція фінального (реального) видалення на сервері
    const executeRealDelete = async (movieId) => {
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`http://localhost:5000/api/movies/${movieId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh?.(); // Оновлюємо глобальний список фільмів
        } catch (error) {
            console.error("Delete error:", error);
            alert(error.response?.data?.error || "Помилка при остаточному видаленні фільму");
        } finally {
            setIsDeleting(false);
            setPendingDelete(null);
        }
    };

    // Клік на кнопку видалення в таблиці
    const handleActionDelete = (movie) => {
        // Якщо вже є фільм у черзі на видалення — видаляємо його негайно, щоб звільнити місце новому
        if (pendingDelete) {
            clearTimeout(deleteTimerRef.current);
            clearInterval(countdownIntervalRef.current);
            executeRealDelete(pendingDelete.id);
        }

        // Ініціалізуємо чергу для поточного фільму
        setPendingDelete(movie);
        setTimeLeft(15);

        // Запускаємо інтервал для лічильника секунд на екрані
        countdownIntervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Запускаємо таймер на 15 секунд для виконання реального запиту
        deleteTimerRef.current = setTimeout(() => {
            clearInterval(countdownIntervalRef.current);
            executeRealDelete(movie.id);
        }, 15000);
    };

    // Клік на кнопку "Відновити"
    const handleUndo = () => {
        clearTimeout(deleteTimerRef.current);
        clearInterval(countdownIntervalRef.current);
        setPendingDelete(null); // Просто очищаємо чергу, фільм знову з'явиться в таблиці
    };

    // Безпечне закриття модалки
    const handleSafeClose = () => {
        // Якщо адмін закриває вікно, а в черзі висить фільм — видаляємо його негайно
        if (pendingDelete) {
            clearTimeout(deleteTimerRef.current);
            clearInterval(countdownIntervalRef.current);
            executeRealDelete(pendingDelete.id);
        }
        onClose();
    };

    // Очищення таймерів при демонтажі компонента (запобігає витоку пам'яті)
    useEffect(() => {
        return () => {
            clearTimeout(deleteTimerRef.current);
            clearInterval(countdownIntervalRef.current);
        };
    }, []);

    if (!isOpen) return null;

    // Фільтруємо список фільмів на екрані: ховаємо той, що зараз у черзі на видалення
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
                            <h2 className="text-xl font-black tracking-tight text-gray-900">{t("admin.title", "Панель адміністратора")}</h2>
                            <p className="text-xs text-gray-400 font-medium">{t("admin.subtitle", "Керування кінотеатром та аналітика")}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSafeClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 active:scale-95 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Таби */}
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

                {/* Основний контент */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                    {activeTab === "movies" ? (
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
                        /* Вкладка статистики (без змін) */
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

                {/* ПЛАВАЮЧИЙ БАНЕР UNDO (Внизу модального вікна з плавною анімацією) */}
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