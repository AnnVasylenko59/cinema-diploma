import React from "react";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle = ({ theme, setTheme }) => {
    const isDark = theme === "Темна";

    return (
        <button
            onClick={() => setTheme(isDark ? "Світла" : "Темна")}
            className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 shadow-sm"
        >
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
    );
};