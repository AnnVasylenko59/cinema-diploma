import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

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
    /**
     * @async
     * @param {Object} credentials - Дані користувача (login/email, password).
     * @returns {Promise<Object>} Токен та дані профілю.
     */
    login: (credentials) => api.post('/users/login', credentials),
    /**
     * @async
     * @param {Object} userData - Дані для нового користувача.
     * @returns {Promise<Object>} Створений профіль.
     */
    register: (userData) => api.post('/users/register', userData),
    /**
     * @async
     * @returns {Promise<Object>} Дані поточного профілю.
     */
    getProfile: () => api.get('/users/profile'),
    /**
     * @async
     * @param {Object} userData - Нові дані для оновлення.
     * @returns {Promise<Object>} Оновлений об'єкт користувача.
     */
    updateProfile: (userData) => api.put('/users/profile', userData),
    /**
     * @async
     * @param {Object} params - login або email для перевірки.
     * @returns {Promise<Object>} Статус доступності.
     */
    checkAvailability: (params) => api.get('/users/check', { params }),
};

/**
 * Об'єкт для роботи з каталогом фільмів.
 */
export const movieAPI = {
    /**
     * @async
     * @param {Object} [filters] - Фільтри пошуку та жанри.
     * @returns {Promise<Object>} Список фільмів.
     */
    getAll: (filters = {}) => api.get('/movies', { params: filters }),
    /**
     * @async
     * @param {number|string} id - Унікальний ID фільму.
     * @returns {Promise<Object>} Деталі фільму.
     */
    getById: (id) => api.get(`/movies/${id}`),
    /**
     * @async
     * @param {number|string} id - ID фільму.
     * @returns {Promise<Object>} Схожі фільми.
     */
    getRecommended: (id) => api.get(`/movies/${id}/recommended`),
    /**
     * @async
     * @returns {Promise<Object>} Список жанрів.
     */
    getGenres: () => api.get('/genres'),
    /**
     * @async
     * @returns {Promise<Object>} Статус здоров'я API.
     */
    test: () => api.get('/health')
};

/**
 * Об'єкт API для роботи з жанрами фільмів.
 */
export const genreAPI = {
    /**
     * Отримує повний перелік доступних жанрів із бази даних.
     * @async
     * @returns {Promise<Object>} Список об'єктів жанрів.
     */
    getAll: () => api.get('/genres'),
};

/**
 * Об'єкт API для роботи з сеансами.
 */
export const showtimeAPI = {
    /**
     * @async
     * @param {Object} [filters={}] - Параметри (movieId, date, cityId).
     * @returns {Promise<Object>} Масив сеансів.
     */
    getShowtimes: (filters = {}) => api.get('/showtimes', { params: filters }),
};

/**
 * Об'єкт API для роботи з кінотеатрами та містами.
 */
export const theaterAPI = {
    /**
     * @async
     * @param {Object} [filters={}] - Фільтр за cityId.
     * @returns {Promise<Object>} Список кінотеатрів.
     */
    getAll: (filters = {}) => api.get('/theaters', { params: filters }),
    /**
     * @async
     * @returns {Promise<Object>} Масив назв доступних міст.
     */
    getCities: () => api.get('/theaters/cities'),
};

/**
 * Об'єкт API для керування списком бажаного.
 */
export const watchlistAPI = {
    /**
     * @async
     * @returns {Promise<Object>} Список фільмів у черзі перегляду користувача.
     */
    get: () => api.get('/watchlist'),
    /**
     * @async
     * @param {number|string} movieId - ID фільму.
     * @returns {Promise<Object>} Статус додавання або видалення.
     */
    toggle: (movieId) => api.post('/watchlist/toggle', { movieId }),
};

export default api;