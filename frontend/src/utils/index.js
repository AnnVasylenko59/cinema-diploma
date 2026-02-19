/**
 * Утиліта для динамічного об'єднання назв CSS класів.
 * @param {...(string|boolean|undefined)} arr - Список класів або умов.
 * @returns {string} Рядок з об'єднаними класами.
 */
export function classNames(...arr) {
    return arr.filter(Boolean).join(" ");
}

/**
 * Конвертує тривалість у хвилинах у формат годин та хвилин (напр. 2h 15m).
 * @param {number} min - Загальна кількість хвилин.
 * @returns {string} Відформатований рядок часу.
 */
export function minutesToHMM(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
}