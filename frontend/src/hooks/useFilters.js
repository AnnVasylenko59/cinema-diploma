import { useState, useEffect } from "react";
import { movieAPI } from "../services/api";

/**
 * @module hooks/useFilters
 * @description Клієнтська багатофакторна фільтрація каталогу фільмів без урахування рейтингів.
 */
export const useFilters = () => {
    const [query, setQuery] = useState("");
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [duration, setDuration] = useState("any");
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await movieAPI.getAll();
                const moviesData = response.data.movies || response.data;
                setMovies(moviesData);
            } catch (err) {
                setError('Помилка завантаження фільмів');
                console.error('Error fetching movies:', err);
                setMovies([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, []);

    /**
     * Препроцесинг та багатофакторна фільтрація масиву фільмів
     */
    const filtered = movies.filter(movie => {
        // 1. Текстовий пошук за назвою або режисером
        const matchesQuery = !query ||
            movie.title?.toLowerCase().includes(query.toLowerCase()) ||
            (movie.director && movie.director.toLowerCase().includes(query.toLowerCase()));

        // 2. Строгий перетин жанрів
        const matchesGenres = selectedGenres.length === 0 ||
            selectedGenres.every(genre =>
                movie.genres?.some(g => {
                    const genreName = g.genre?.name || g.name || g;
                    return typeof genreName === 'string' && genreName.toLowerCase() === genre.toLowerCase();
                })
            );

        // 3. Фільтрація за тривалістю
        let matchesDuration = true;

        const movieDurationRaw = movie.durationMin || movie.duration;

        if (duration !== "any" && movieDurationRaw) {
            const mins = parseInt(movieDurationRaw, 10);
            if (!isNaN(mins)) {
                if (duration === "short") matchesDuration = mins <= 90;
                else if (duration === "medium") matchesDuration = mins > 90 && mins <= 130;
                else if (duration === "long") matchesDuration = mins > 130;
            }
        }

        return matchesQuery && matchesGenres && matchesDuration;
    });

    return {
        query, setQuery,
        selectedGenres, setSelectedGenres,
        duration, setDuration,
        movies,
        filtered,
        loading,
        error
    };
};