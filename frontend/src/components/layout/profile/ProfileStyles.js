import { Settings, Heart, Clock, Star } from "lucide-react";

export const getMenuItems = (t) => [
    { label: t('profile_menu.settings'), icon: Settings, key: "settings" },
    { label: t('profile_menu.favorites'), icon: Heart, key: "favorites" },
    { label: t('profile_menu.history'), icon: Clock, key: "history" },
    { label: t('profile_menu.ratings'), icon: Star, key: "ratings" },
];

export const styles = {
    dropdown: "absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-100 z-50 overflow-hidden",
    item: "w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group",
    logout: "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
};