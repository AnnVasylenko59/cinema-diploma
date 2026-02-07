import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";

// Складові інтерфейсу (додаємо ../ щоб вийти з core до src)
import { Header } from "../components/layout/header/Header.jsx";
import { Footer } from "../components/layout/footer/Footer.jsx";
import { LoginModal } from "../components/layout/auth/LoginModal.jsx";
import { RegisterModal } from "../components/layout/auth/RegisterModal.jsx";
import { MovieModal } from "../components/movies/modal/MovieModal.jsx";

// Сторінки
import { HomePage } from "../components/pages/home/HomePage.jsx";
import { TheatersPage } from "../components/pages/theaters/TheatersPage.jsx";
import { BookingPage } from "../components/pages/booking/BookingPage.jsx";
import { ConfirmationPage } from "../components/pages/booking/ConfirmationPage.jsx";

// Профільні модалки
import { ProfileSettingsModal } from "../components/layout/profile/settings/ProfileSettingsModal.jsx";
import { FavoritesModal } from "../components/layout/profile/favorites/FavoritesModal.jsx";
import { BookingsHistoryModal } from "../components/layout/profile/history/BookingsHistoryModal.jsx";
import { RatingsModal } from "../components/layout/profile/ratings/RatingsModal.jsx";

// Хуки та сервіси
import { useAuth } from "../hooks/useAuth.js";
import { useFilters } from "../hooks/useFilters.js";
import { movieAPI, watchlistAPI, genreAPI } from "../services/api.js";

export default function App() {
    const { t } = useTranslation();
    const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

    // Глобальні стани інтерфейсу
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [step, setStep] = useState("home");

    // Стани для збереження вибору користувача
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedDate, setSelectedDate] = useState(todayStr);

    // Стани даних фільмів
    const [openMovie, setOpenMovie] = useState(null);
    const [currentMovie, setCurrentMovie] = useState(null);
    const [chosenShowtime, setChosenShowtime] = useState(null);
    const [previousModal, setPreviousModal] = useState(null);

    const [movies, setMovies] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [watchlistIds, setWatchlistIds] = useState([]);

    // Стани модальних вікон
    const [loginOpen, setLoginOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [profileModal, setProfileModal] = useState(null);

    const { user, login, register, logout, updateUser } = useAuth();
    const filters = useFilters();

    const isAnyModalOpen = !!(profileModal || openMovie || loginOpen || registerOpen);

    // Теми та ефекти
    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleToggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const movieRes = await movieAPI.getAll();
            setMovies(movieRes.data.movies || movieRes.data || []);
            try {
                const genreRes = await genreAPI.getAll();
                setGenres(genreRes.data || []);
            } catch (_genreErr) {
                setGenres([]);
            }
        } catch (_err) {
            setError(t('errors.default_message'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const fetchWatchlist = useCallback(async () => {
        if (!user) { setWatchlistIds([]); return; }
        try {
            const res = await watchlistAPI.get();
            setWatchlistIds(res.data.map(m => m.id));
        } catch (_err) {
            console.error("Failed to fetch watchlist");
        }
    }, [user]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);
    useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

    const filteredMovies = useMemo(() => {
        return movies.filter(m => {
            const matchesQuery = m.title.toLowerCase().includes(filters.query.toLowerCase());
            const matchesRating = (m.rating || 0) >= filters.rating;
            const matchesGenres = filters.selectedGenres.length === 0 ||
                filters.selectedGenres.every(selectedName =>
                    m.genres?.some(mg => mg.genre.name === selectedName)
                );
            return matchesQuery && matchesRating && matchesGenres;
        });
    }, [movies, filters.query, filters.rating, filters.selectedGenres]);

    // Обробка бронювання
    const handleConfirmSeats = useCallback(async (selectedSeats) => {
        if (!user) {
            setLoginOpen(true);
            return;
        }
        try {
            const token = localStorage.getItem('authToken');
            const res = await axios.post(
                'http://localhost:5000/api/bookings',
                { showtimeId: chosenShowtime.id, selectedSeats },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) setStep("confirmation");
        } catch (_err) {
            alert(t('errors.default_message'));
        }
    }, [user, chosenShowtime, t]);

    const handleToggleWatchlist = async (movieId) => {
        if (!user) { setLoginOpen(true); return; }
        try {
            const res = await watchlistAPI.toggle(movieId);
            if (res.data.added) setWatchlistIds(prev => [...prev, movieId]);
            else setWatchlistIds(prev => prev.filter(id => id !== movieId));
        } catch (_err) {
            console.error("Watchlist toggle error");
        }
    };

    const handleGoHome = () => {
        setStep("home");
        setProfileModal(null);
        setOpenMovie(null);
        setPreviousModal(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenMovieFromProfile = (movie, sourceModal) => {
        setPreviousModal(sourceModal);
        setOpenMovie(movie);
        setProfileModal(null);
    };

    const handleCloseMovieModal = () => {
        setOpenMovie(null);
        if (previousModal) {
            setProfileModal(previousModal);
            setPreviousModal(null);
        }
    };

    const renderPage = () => {
        switch (step) {
            case "home":
                return (
                    <HomePage
                        {...filters}
                        movies={movies}
                        filtered={filteredMovies}
                        genres={genres}
                        loading={loading}
                        error={error}
                        onRetry={loadInitialData}
                        onOpenMovie={setOpenMovie}
                        onWatchTrailer={setOpenMovie}
                        watchlistIds={watchlistIds}
                        onToggleWatchlist={handleToggleWatchlist}
                    />
                );
            case "theaters":
                return (
                    <TheatersPage
                        currentMovie={currentMovie}
                        setStep={setStep}
                        selectedCity={selectedCity}
                        setSelectedCity={setSelectedCity}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        onPickShowtime={(s) => { setChosenShowtime(s); setStep("booking"); }}
                        onOpenMovie={setOpenMovie}
                    />
                );
            case "booking":
                return chosenShowtime && (
                    <BookingPage
                        chosenShowtime={chosenShowtime}
                        setStep={setStep}
                        onConfirmSeats={handleConfirmSeats}
                    />
                );
            case "confirmation":
                return <ConfirmationPage setStep={setStep} />;
            default: return null;
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-[#f1f5f9] text-gray-900'}`}>
            <div className={`sticky top-0 z-[50] ${
                isAnyModalOpen
                    ? "blur-md opacity-40 pointer-events-none scale-[0.99] transition-all duration-500"
                    : "blur-0 opacity-100 scale-100"
            }`}>
                <Header
                    step={step}
                    setStep={setStep}
                    user={user}
                    onLogout={logout}
                    onOpenLoginModal={() => setLoginOpen(true)}
                    onMenuSelect={setProfileModal}
                    theme={theme}
                    onToggleTheme={handleToggleTheme}
                />
            </div>

            <main className={`mx-auto max-w-7xl p-4 transition-all duration-500 ${
                isAnyModalOpen ? "blur-[2px] pointer-events-none" : "blur-0"
            }`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderPage()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Модальні вікна авторизації */}
            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onLogin={login}
                onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }}
            />
            <RegisterModal
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
                onRegister={register}
                onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }}
            />

            {/* Модальне вікно фільму */}
            <MovieModal
                movie={openMovie}
                onClose={handleCloseMovieModal}
                onFindTheaters={(m) => { setCurrentMovie(m); setStep("theaters"); setOpenMovie(null); }}
                isFavorite={openMovie && watchlistIds.includes(openMovie.id)}
                onToggleWatchlist={handleToggleWatchlist}
            />

            {/* Профільні модалки */}
            {profileModal === "settings" && <ProfileSettingsModal open onClose={() => setProfileModal(null)} user={user} onSave={updateUser} onGoHome={handleGoHome} />}
            {profileModal === "favorites" && <FavoritesModal open onClose={() => setProfileModal(null)} user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} onOpenMovie={(m) => handleOpenMovieFromProfile(m, "favorites")} onGoHome={handleGoHome} />}
            {profileModal === "history" && <BookingsHistoryModal open onClose={() => setProfileModal(null)} user={user} onOpenMovie={(m) => handleOpenMovieFromProfile(m, "history")} onGoHome={handleGoHome} />}
            {profileModal === "ratings" && <RatingsModal open onClose={() => setProfileModal(null)} user={user} onOpenMovie={(m) => handleOpenMovieFromProfile(m, "ratings")} onGoHome={handleGoHome} />}

            <Footer />
        </div>
    );
}