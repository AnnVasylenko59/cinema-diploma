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

export const authAPI = {
    login: (credentials) => api.post('/users/login', credentials),
    register: (userData) => api.post('/users/register', userData),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (userData) => api.put('/users/profile', userData),
    checkAvailability: (params) => api.get('/users/check', { params }),
};

export const movieAPI = {
    getAll: (filters = {}) => api.get('/movies', { params: filters }),
    getById: (id) => api.get(`/movies/${id}`),
    getRecommended: (id) => api.get(`/movies/${id}/recommended`),
    // ВИПРАВЛЕНО: шлях змінено на /genres
    getGenres: () => api.get('/genres'),
    test: () => api.get('/health')
};

export const genreAPI = {
    getAll: () => api.get('/genres'),
};

export const showtimeAPI = {
    getShowtimes: (filters = {}) => api.get('/showtimes', { params: filters }),
};

export const theaterAPI = {
    getAll: (filters = {}) => api.get('/theaters', { params: filters }),
    getCities: () => api.get('/theaters/cities'),
};

export const watchlistAPI = {
    get: () => api.get('/watchlist'),
    toggle: (movieId) => api.post('/watchlist/toggle', { movieId }),
};

export default api;