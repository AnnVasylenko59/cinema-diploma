export function classNames(...arr) {
    return arr.filter(Boolean).join(" ");
}

export function minutesToHMM(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
}