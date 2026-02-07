const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// --- ЗАГАЛЬНІ КРОКИ ---
Given('користувач відкриває сторінку {string}', async function (url) {
    await this.page.goto(url);
});

Then('користувач повинен побачити {string}', async function (text) {
    // first() беремо, бо текст може зустрічатися кілька разів
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 5000 });
});

// --- КРОКИ ЛОГІНУ ---
When('користувач натискає кнопку входу', async function () {
    await this.page.locator('header').getByText('Увійти').click();
});

When('користувач вводить логін {string} і пароль {string}', async function (login, password) {
    const loginInput = this.page.getByPlaceholder('Введіть логін або email');
    await expect(loginInput).toBeVisible();
    await loginInput.fill(login);
    await this.page.getByPlaceholder('Введіть пароль').fill(password);
});

When('користувач підтверджує вхід', async function () {
    const modal = this.page.locator('.fixed.inset-0');
    const submitBtn = modal.getByRole('button', { name: 'Увійти' });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
});

When('користувач вводить {string} у поле пошуку', async function (query) {
    const searchInput = this.page.getByPlaceholder('Пошук: назва, режисер, актор');
    await searchInput.fill(query);
    // Невелика пауза для реакту, щоб відфільтрувати список
    await this.page.waitForTimeout(500);
});

Then('користувач повинен побачити фільм {string}', async function (movieName) {
    // Перевіряємо, що карточка з такою назвою є видимою
    await expect(this.page.getByText(movieName).first()).toBeVisible();
});

Then('користувач повинен побачити повідомлення {string}', async function (msg) {
    await expect(this.page.getByText(msg)).toBeVisible();
});