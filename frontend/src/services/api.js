import axios from 'axios';
import i18n from '../core/i18n.js';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
});

api.interceptors.request.use(config => {
    const correlationId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    config.headers['X-Correlation-ID'] = correlationId;
    return config;
}, error => Promise.reject(error));

api.interceptors.request.use(config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.request.use(config => {
    let currentLang = localStorage.getItem('i18nextLng') || i18n.language || 'uk';
    const prismaLang = currentLang.startsWith('en') ? 'en' : 'uk';

    config.params = {
        ...config.params,
        lang: prismaLang
    };

    config.headers = {
        ...config.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    return config;
}, error => Promise.reject(error));

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') console.error('⏰ API Timeout');
        return Promise.reject(error);
    }
);

/**
 * Об'єкт для роботи з авторизацією та профілем.
 */
export const authAPI = {
    login: (credentials) => api.post('/users/login', credentials),
    register: (userData) => api.post('/users/register', userData),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (userData) => api.put('/users/profile', userData),
    checkAvailability: (params) => api.get('/users/check', { params }),
};

/**
 * Об'єкт для роботи з каталогом逢ільмів.
 */
export const movieAPI = {
    getAll: (filters = {}) => api.get('/movies', { params: filters }),
    getById: (id) => api.get(`/movies/${id}`),
    getRecommended: () => api.get('/movies/recommendations'),
    getGenres: () => api.get('/genres'),
    test: () => api.get('/health')
};

/**
 * Об'єкт API для роботи з жанрами фільмів.
 */
export const genreAPI = {
    getAll: () => api.get('/genres'),
};

/**
 * Об'єкт API для роботи з сеансами.
 */
export const showtimeAPI = {
    getShowtimes: (filters = {}) => api.get('/showtimes', { params: filters }),
};

/**
 * Об'єкт API для роботи з кінотеатрами та містами.
 */
export const theaterAPI = {
    getAll: (filters = {}) => api.get('/theaters', { params: filters }),
    getCities: () => api.get('/theaters/cities'),
};

/**
 * Об'єкт API для керування списком бажаного.
 */
export const watchlistAPI = {
    get: () => api.get('/watchlist'),
    toggle: (movieId) => api.post('/watchlist/toggle', { movieId }),
};

/**
 * Об'єкт API для централізованого логування помилок.
 */
export const logAPI = {
    sendError: async (message, context = {}) => {
        try {
            await api.post('/logs', { level: 'error', message, context });
        } catch (error) {
            console.warn("⚠️ Не вдалося відправити лог: бекенд недоступний.", error.message);
        }
    },
};

export default api;