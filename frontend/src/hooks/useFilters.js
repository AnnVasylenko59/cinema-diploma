import { useState, useEffect } from "react";
import { movieAPI } from "../services/api";

/**
 * Хук для керування фільтрацією списку фільмів.
 * @returns {Object} Об'єкт зі станами фільтрів (query, selectedGenres, rating, time) та результатом filtered.
 */
export const useFilters = () => {
    const [query, setQuery] = useState("");
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [rating, setRating] = useState(0);
    const [time, setTime] = useState("any");
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        /**
         * Внутрішня функція для завантаження початкового списку фільмів.
         * @async
         */
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
     * Відфільтрований масив фільмів на основі активних параметрів пошуку.
     * @type {Array<Object>}
     */
    const filtered = movies.filter(movie => {
        const matchesQuery = !query ||
            movie.title.toLowerCase().includes(query.toLowerCase()) ||
            (movie.director && movie.director.toLowerCase().includes(query.toLowerCase()));

        const matchesGenres = selectedGenres.length === 0 ||
            selectedGenres.every(genre =>
                movie.genres?.some(g => {
                    const genreName = g.genre?.name || g;
                    return genreName.toLowerCase().includes(genre.toLowerCase());
                })
            );

        const matchesRating = !rating || (movie.rating && movie.rating >= rating);

        return matchesQuery && matchesGenres && matchesRating;
    });

    return {
        query, setQuery,
        selectedGenres, setSelectedGenres,
        rating, setRating,
        time, setTime,
        movies,
        filtered,
        loading,
        error
    };
};