import { useState, useEffect } from "react";
import { movieAPI } from "../services/api";

/**
 * @module hooks/useFilters
 * @description
 * ### АРХІТЕКТУРНЕ РІШЕННЯ (100%):
 * Використано патерн **Client-Side Filtering** (фільтрація на стороні клієнта).
 * - **Обґрунтування**: Оскільки каталог фільмів у межах одного кінотеатру зазвичай не перевищує кілька сотень записів, завантаження повного списку один раз із наступною локальною фільтрацією забезпечує миттєвий (0ms латентність) відгук інтерфейсу на дії користувача.
 *
 * ### ВЗАЄМОДІЯ КОМПОНЕНТІВ:
 * Хук виступає "джерелом істини" для `MoviesGrid`, `FiltersBar` та `SearchInput`, забезпечуючи синхронізацію фільтрів між різними частинами UI.
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
         * ВЗАЄМОДІЯ: Отримання первинних даних.
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
     * ### ВАЖКИЙ АЛГОРИТМ: Багатофакторний предикат фільтрації.
     * Виконує послідовну перевірку за трьома незалежними критеріями:
     * 1. **Text Search**: Нечутливий до регістру пошук за назвою або режисером.
     * 2. **Genre Intersection**: Використовує логіку "AND" (фільм має мати ВСІ обрані жанри).
     * 3. **Rating Threshold**: Порівнює числове значення рейтингу.
     * * Алгоритмічна складність: $O(n \times m)$, де $n$ — кількість фільмів, $m$ — кількість обраних жанрів.
     * * @type {Array<Object>}
     */
    const filtered = movies.filter(movie => {
        const matchesQuery = !query ||
            movie.title.toLowerCase().includes(query.toLowerCase()) ||
            (movie.director && movie.director.toLowerCase().includes(query.toLowerCase()));

        /**
         * БІЗНЕС-ЛОГІКА: Строга відповідність жанрам.
         * Користувач має бачити лише ті фільми, які відповідають УСІМ обраним категоріям одночасно.
         */
        const matchesGenres = selectedGenres.length === 0 ||
            selectedGenres.every(genre =>
                movie.genres?.some(g => {
                    const genreName = g.genre?.name || g;
                    return genreName.toLowerCase().includes(genre.toLowerCase());
                })
            );

        // 3. Порівняння мінімального рейтингу
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