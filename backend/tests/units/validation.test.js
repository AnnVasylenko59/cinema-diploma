const { validateUsername, validatePassword, validateRating, validateEmail } = require('../../utils/validation');

describe('Unit Tests: Requirements Validation (LR1)', () => {

    // === Тестування вимоги R1.9 (Username: літери/цифри, макс 20) ===
    describe('R1.9: Username Validation', () => {

        test('should accept valid username', () => {
            const result = validateUsername('User123');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should fail if empty or null', () => {
            expect(validateUsername('').isValid).toBe(false);
            expect(validateUsername(null).isValid).toBe(false);
            expect(validateUsername(undefined).isValid).toBe(false);
        });

        test('should fail if shorter than 3 chars', () => {
            const result = validateUsername('ab');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('занадто короткий');
        });

        test('should fail if longer than 20 chars', () => {
            const longUser = 'a'.repeat(21); // 21 символ
            const result = validateUsername(longUser);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('макс. 20 символів');
        });

        test('should accept exactly 20 chars', () => {
            const exactUser = 'a'.repeat(20);
            const result = validateUsername(exactUser);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should accept exactly 3 chars', () => {
            const result = validateUsername('abc');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should fail if contains special characters', () => {
            const result = validateUsername('User_Name!');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('тільки літери та цифри');
        });

        test('should fail if contains spaces', () => {
            const result = validateUsername('User Name');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('тільки літери та цифри');
        });

        test('should fail if contains cyrillic characters', () => {
            const result = validateUsername('Користувач');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('тільки літери та цифри');
        });

        test('should trim whitespace', () => {
            const result = validateUsername('  User123  ');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should accept only numbers', () => {
            const result = validateUsername('123456');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should accept only letters', () => {
            const result = validateUsername('Username');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });
    });

    // === Тестування вимоги R1.10 (Password: мін 8 символів) ===
    describe('R1.10: Password Validation', () => {

        test('should accept password with 8+ chars', () => {
            const result = validatePassword('password123');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should accept password with exactly 8 chars', () => {
            const result = validatePassword('12345678');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should fail if password is too short (<8)', () => {
            const result = validatePassword('pass');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('мінімум 8 символів');
        });

        test('should fail if password is too short (7 chars)', () => {
            const result = validatePassword('1234567');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('мінімум 8 символів');
        });

        test('should handle empty password', () => {
            const result = validatePassword('');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should handle null password', () => {
            const result = validatePassword(null);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should handle undefined password', () => {
            const result = validatePassword(undefined);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should accept password with special characters', () => {
            const result = validatePassword('pass@123!');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });
    });

    // === Тестування вимоги R1.8 (Rating: 1-10) ===
    describe('R1.8: Rating Validation', () => {

        test('should accept valid rating (1-10)', () => {
            expect(validateRating(5).isValid).toBe(true);
            expect(validateRating(1).isValid).toBe(true);
            expect(validateRating(10).isValid).toBe(true);
        });

        test('should accept string numbers', () => {
            expect(validateRating('5').isValid).toBe(true);
            expect(validateRating('10').isValid).toBe(true);
        });

        test('should fail if rating is not a number', () => {
            const result = validateRating('bad');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('має бути числом');
        });

        test('should fail if rating is out of range (<1)', () => {
            const result = validateRating(0);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('від 1 до 10');
        });

        test('should fail if rating is out of range (>10)', () => {
            const result = validateRating(11);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('від 1 до 10');
        });

        test('should fail if rating is negative', () => {
            const result = validateRating(-5);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('від 1 до 10');
        });

        test('should fail if empty rating', () => {
            const result = validateRating('');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should fail if null rating', () => {
            const result = validateRating(null);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should fail if undefined rating', () => {
            const result = validateRating(undefined);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should accept decimal ratings within range', () => {
            expect(validateRating(5.5).isValid).toBe(true);
            expect(validateRating(1.1).isValid).toBe(true);
            expect(validateRating(9.9).isValid).toBe(true);
        });
    });

    // === Тестування Email Validation ===
    describe('Email Validation', () => {

        test('should accept valid email', () => {
            expect(validateEmail('user@gmail.com').isValid).toBe(true);
            expect(validateEmail('test@ukr.net').isValid).toBe(true);
            expect(validateEmail('john.doe@company.co.uk').isValid).toBe(true);
        });

        test('should fail without @ symbol', () => {
            const result = validateEmail('usergmail.com');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('@');
        });

        test('should fail with invalid domain format', () => {
            const result = validateEmail('user@example');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Додайте домен');
        });

        test('should fail with short domain', () => {
            const result = validateEmail('user@example.c');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('2 символи');
        });

        test('should fail if empty', () => {
            const result = validateEmail('');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should fail if null', () => {
            const result = validateEmail(null);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should fail if undefined', () => {
            const result = validateEmail(undefined);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("обов'язковим");
        });

        test('should fail with multiple @ symbols', () => {
            const result = validateEmail('user@name@domain.com');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Неправильний формат');
        });

        test('should fail with only domain part', () => {
            const result = validateEmail('@gmail.com');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Неправильний формат');
        });

        test('should accept email with numbers and special characters in local part', () => {
            const result = validateEmail('user.name+tag123@domain.com');
            expect(result.isValid).toBe(true);
        });
    });
});