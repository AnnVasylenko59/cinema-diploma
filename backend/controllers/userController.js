const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validateUsername, validatePassword, validateEmail } = require('../utils/validation');

const prisma = new PrismaClient();

/**
 * Виконує реєстрацію нового користувача з валідацією даних та хешуванням пароля.
 * @async
 * @param {Object} req - Запит, що містить login, email, name, password.
 * @param {Object} res - Відповідь із даними створеного користувача.
 */
const register = async (req, res) => {
    try {
        const { login, email, name, password } = req.body;

        if (!login || !email || !name || !password) {
            return res.status(400).json({
                success: false,
                error: 'Всі поля є обов\'язковими'
            });
        }

        const usernameCheck = validateUsername(login);
        if (!usernameCheck.isValid) {
            return res.status(400).json({ success: false, error: `Логін: ${usernameCheck.error}` });
        }

        const emailCheck = validateEmail(email);
        if (!emailCheck.isValid) {
            return res.status(400).json({ success: false, error: `Email: ${emailCheck.error}` });
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            return res.status(400).json({ success: false, error: `Пароль: ${passwordCheck.error}` });
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { login }] }
        });

        if (existingUser) {
            return res.status(409).json({ success: false, error: 'Користувач вже існує' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: { login, email, name, password: hashedPassword, isAdmin: false }
        });

        const { ...userWithoutPassword } = newUser;
        res.status(201).json({ success: true, user: userWithoutPassword });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера при реєстрації' });
    }
};

/**
 * Виконує авторизацію користувача та повертає JWT токен.
 * @async
 * @param {Object} req - Запит із логіном та паролем.
 * @param {Object} res - Відповідь із JWT токеном та даними користувача.
 */
const loginUser = async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({ success: false, error: 'Логін та пароль обовʼязкові' });
        }

        const user = await prisma.user.findFirst({
            where: { OR: [{ login: login }, { email: login }] }
        });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Неправильний логін або пароль' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, error: 'Неправильний логін або пароль' });
        }

        const token = jwt.sign(
            { userId: user.id, login: user.login, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'fallback-secret-key-for-development',
            { expiresIn: '24h' }
        );

        const userWithoutPassword = {
            id: user.id,
            login: user.login,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            favoriteGenres: user.favoriteGenres,
            language: user.language,
            theme: user.theme,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt
        };

        res.json({ success: true, user: userWithoutPassword, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера при авторизації' });
    }
};

/**
 * Отримує дані профілю поточного авторизованого користувача.
 * @async
 * @param {Object} req - Об'єкт запиту з даними з JWT токена.
 * @param {Object} res - Відповідь з публічними даними профілю.
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;

        if (!userId) {
            return res.status(401).json({ error: 'Неавторизований запит' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                login: true,
                name: true,
                email: true,
                avatar: true,
                favoriteGenres: true,
                language: true,
                theme: true,
                isAdmin: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
};

/**
 * Оновлює параметри профілю поточного користувача.
 * @async
 * @param {Object} req - Запит з новими даними профілю.
 * @param {Object} res - Результат оновлення.
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Неавторизований запит' });
        }

        const { name, avatar, favoriteGenres, language, theme } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name,
                avatar: avatar,
                favoriteGenres: favoriteGenres,
                language: language,
                theme: theme
            },
            select: {
                id: true,
                login: true,
                name: true,
                email: true,
                avatar: true,
                favoriteGenres: true,
                language: true,
                theme: true,
                isAdmin: true,
                createdAt: true
            }
        });

        res.json({
            success: true,
            message: 'Профіль успішно оновлено',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Помилка сервера при оновленні профілю'
        });
    }
};

/**
 * Перевіряє доступність логіна або email у системі.
 * @async
 * @param {Object} req - Запит з параметром login або email.
 * @param {Object} res - Об'єкт з прапорцем available.
 */
const checkAvailability = async (req, res) => {
    try {
        const { login, email } = req.query;
        let existing = null;

        if (login) {
            existing = await prisma.user.findUnique({ where: { login } });
        } else if (email) {
            existing = await prisma.user.findUnique({ where: { email } });
        }

        res.json({ available: !existing });
    } catch {
        res.status(500).json({ error: 'Помилка перевірки' });
    }
};

module.exports = {
    register,
    loginUser,
    getProfile,
    updateProfile,
    checkAvailability
};