import { useState, useEffect } from "react";
import { authAPI } from "../services/api";
import api from "../services/api";
import i18n from '../core/i18n.js';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("userData");

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                if (parsedUser.language) {
                    const langCode = parsedUser.language === 'English' ? 'en' : 'uk';
                    i18n.changeLanguage(langCode);
                }
            } catch (e) {
                console.error("Помилка парсингу даних користувача:", e);
                logout();
            }
        }
    }, []);

    const updateUser = (updatedData) => {
        if (!updatedData) return;

        setUser(updatedData);

        if (updatedData.language) {
            const langCode = updatedData.language === 'English' ? 'en' : 'uk';
            i18n.changeLanguage(langCode);
        }

        try {
            localStorage.setItem("userData", JSON.stringify(updatedData));
        } catch (e) {
            console.warn("LocalStorage переповнений. Збережено лише в сесії.", e);
            try {
                const lightweightData = { ...updatedData, avatar: null };
                localStorage.setItem("userData", JSON.stringify(lightweightData));
            } catch (innerError) {
                console.error("Критична помилка сховища:", innerError);
            }
        }
    };

    const login = async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authAPI.login(credentials);
            const { user: userData, token } = response.data;

            localStorage.setItem("authToken", token);
            localStorage.setItem("userData", JSON.stringify(userData));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            if (userData.language) {
                const langCode = userData.language === 'English' ? 'en' : 'uk';
                i18n.changeLanguage(langCode);
            }

            setUser(userData);
            return { success: true, user: userData };
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Помилка авторизації";
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authAPI.register(userData);
            const { user: newUser, token } = response.data;

            localStorage.setItem("authToken", token);
            localStorage.setItem("userData", JSON.stringify(newUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(newUser);
            return { success: true, user: newUser };
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Помилка реєстрації";
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setError(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        delete api.defaults.headers.common['Authorization'];
        i18n.changeLanguage('uk');
    };

    return {
        user, login, register, updateUser, logout, loading, error, isAuthenticated: !!user
    };
};