const request = require('supertest');
const { app, prisma } = require('../app');

beforeAll(async () => {
    // Підключаємося до БД один раз перед запуском всіх тестів
    await prisma.$connect();
});

beforeEach(async () => {
    // Очищуємо БД перед кожним тестом, щоб гарантувати ізоляцію
    // Порядок важливий через foreign key constraints
    await prisma.ticket.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.watchlistItem.deleteMany({});
    await prisma.user.deleteMany({});
});

afterAll(async () => {
    // Повністю очищуємо БД в кінці та відключаємося
    await prisma.ticket.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.watchlistItem.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
});

// === Тестовий Набір: Інтеграція Модулів Авторизації ===

describe('Auth Integration Tests (INT_TC)', () => {

    // Базовий об'єкт користувача для тестів
    const baseTestUser = {
        login: "testuser",
        email: "test@example.com",
        name: "Test User",
    };

    /**
     * Тест-кейс: INT_TC_01 (Позитивний сценарій)
     * Перевіряє, що користувач, створений Компонентом А (Реєстрація),
     * може бути успішно перевірений Компонентом Б (Логін).
     */
    test('INT_TC_01: should register a user and then log in successfully', async () => {

        // Готуємо валідні дані (пароль, що проходить валідацію)
        const validTestUser = { ...baseTestUser, password: "Password123!" };

        // Крок 1: (Компонент А - Реєстрація)
        const registerResponse = await request(app)
            .post('/api/users/register')
            .send(validTestUser);

        // Перевірка, що реєстрація успішна
        expect(registerResponse.statusCode).toBe(201);
        expect(registerResponse.body.user.login).toBe(validTestUser.login);

        // Крок 2: (Компонент Б - Логін)
        const loginResponse = await request(app)
            .post('/api/users/login')
            .send({
                login: validTestUser.login,
                password: validTestUser.password
            });

        // Перевірка, що логін успішний
        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body.user.login).toBe(validTestUser.login);
        expect(loginResponse.body.token).toBeDefined();
    });

    /**
     * Тест-кейс: INT_TC_02 (Неправильний пароль)
     * Перевіряє, що Компонент Б (Логін) коректно відхиляє неправильний пароль.
     */
    test('INT_TC_02: should return 401 on login with wrong password', async () => {
        // Крок 1: Спершу реєструємо користувача
        const validTestUser = { ...baseTestUser, login: "user2", email: "user2@test.com", password: "Password123!" };
        await request(app)
            .post('/api/users/register')
            .send(validTestUser);

        // Крок 2: Спроба логіну з НЕПРАВИЛЬНИМ паролем
        const loginResponse = await request(app)
            .post('/api/users/login')
            .send({
                login: validTestUser.login,
                password: "WRONG_PASSWORD"
            });

        // Перевірка: очікуємо статус 401 та повідомлення про помилку
        expect(loginResponse.statusCode).toBe(401);
        expect(loginResponse.body.error).toBe("Неправильний логін або пароль");
    });

    /**
     * Тест-кейс: INT_TC_03 (Реєстрація дублікату)
     * Перевіряє, що Компонент А (Реєстрація) не дає створити дублікат.
     */
    test('INT_TC_03: should return 409 on duplicate registration', async () => {
        // Крок 1: Перша (успішна) реєстрація
        const validTestUser = { ...baseTestUser, login: "user3", email: "user3@test.com", password: "Password123!" };
        await request(app)
            .post('/api/users/register')
            .send(validTestUser);

        // Крок 2: Друга (неуспішна) реєстрація з тими ж даними
        const duplicateResponse = await request(app)
            .post('/api/users/register')
            .send(validTestUser);

        // Перевірка: очікуємо статус 409 (Конфлікт)
        expect(duplicateResponse.statusCode).toBe(409);
        expect(duplicateResponse.body.error).toContain("вже існує");
    });

    /**
     * Тест-кейс: INT_TC_04 (Логін неіснуючого юзера)
     * Перевіряє, що Компонент Б (Логін) не дає увійти неіснуючому користувачу.
     */
    test('INT_TC_04: should return 401 on login with non-existent user', async () => {
        // (Крок 1 не потрібен, 'beforeEach' гарантує чисту БД)

        // Крок 2: Спроба логіну
        const loginResponse = await request(app)
            .post('/api/users/login')
            .send({
                login: "ghost_user",
                password: "password123"
            });

        // Перевірка: очікуємо статус 401
        expect(loginResponse.statusCode).toBe(401);
        expect(loginResponse.body.error).toBe("Неправильний логін або пароль");
    });
});