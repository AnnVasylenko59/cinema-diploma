/**
 * Валідація імені користувача згідно з вимогою R1.9.
 * Вимоги:
 * - Обов'язкове поле
 * - Максимум 20 символів
 * - Тільки літери та цифри (латиниця)
 * - (Додатково: мінімум 3 символи для адекватності)
 */
function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        return { isValid: false, error: 'Username є обов\'язковим' };
    }

    const trimmed = username.trim();

    if (trimmed.length < 3) {
        return { isValid: false, error: 'Username занадто короткий (мін. 3 символи)' };
    }

    if (trimmed.length > 20) {
        return { isValid: false, error: 'Username занадто довгий (макс. 20 символів)' };
    }

    // Regex: тільки букви (a-z, A-Z) і цифри (0-9)
    const validPattern = /^[a-zA-Z0-9]+$/;
    if (!validPattern.test(trimmed)) {
        return { isValid: false, error: 'Username має містити тільки літери та цифри' };
    }

    return { isValid: true, error: null };
}

/**
 * Валідація пароля згідно з вимогою R1.10.
 * Вимоги:
 * - Обов'язкове поле
 * - Мінімум 8 символів
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { isValid: false, error: 'Password є обов\'язковим' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'Password має містити мінімум 8 символів' };
    }

    return { isValid: true, error: null };
}

/**
 * Валідація рейтингу фільму (для вимоги R1.8).
 * Логіка:
 * - Має бути числом
 * - Діапазон від 1 до 10 (або 1-5, як у вас прийнято)
 */
function validateRating(rating) {
    if (rating === undefined || rating === null || rating === '') {
        return { isValid: false, error: 'Рейтинг є обов\'язковим' };
    }

    const numRating = Number(rating);

    if (isNaN(numRating)) {
        return { isValid: false, error: 'Рейтинг має бути числом' };
    }

    if (numRating < 1 || numRating > 10) {
        return { isValid: false, error: 'Рейтинг має бути в межах від 1 до 10' };
    }

    return { isValid: true, error: null };
}

/**
 * Валідація email згідно з вимогами фронтенду
 * Вимоги:
 * - Обов'язкове поле
 * - Повинен містити @
 * - Повинен мати коректний домен з крапкою
 * - Домен має містити мінімум 2 символи після крапки
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email є обов\'язковим' };
    }

    const trimmed = email.trim();

    if (!trimmed.includes('@')) {
        return { isValid: false, error: 'Введіть символ @' };
    }

    const parts = trimmed.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return { isValid: false, error: 'Неправильний формат після @' };
    }

    if (!parts[1].includes('.')) {
        return { isValid: false, error: 'Додайте домен після @ (наприклад, gmail.com)' };
    }

    const domainParts = parts[1].split('.');
    if (domainParts.length < 2 || domainParts[1]?.length < 2) {
        return { isValid: false, error: 'Домен має містити мінімум 2 символи після крапки' };
    }

    return { isValid: true, error: null };
}

module.exports = {
    validateUsername,
    validatePassword,
    validateRating,
    validateEmail
};