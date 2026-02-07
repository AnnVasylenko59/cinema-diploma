const { setWorldConstructor, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');

// Збільшуємо таймаут (60 секунд)
setDefaultTimeout(60 * 1000);

class CustomWorld {
    async openBrowser() {
        this.browser = await chromium.launch({ headless: false });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

setWorldConstructor(CustomWorld);

Before(async function () {
    await this.openBrowser();
});

After(async function () {
    await this.closeBrowser();
});