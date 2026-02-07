import React, { useState, useRef, useEffect } from "react";
import { LogOut, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { styles, getMenuItems } from "./ProfileStyles";
import { ProfileAvatar } from "./ProfileAvatar";

export const ProfileMenu = ({ user, onLogout, onMenuSelect }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef();
    const menuItems = getMenuItems(t);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                className="w-10 h-10 rounded-2xl bg-gray-900 border-2 border-white overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-md"
                onClick={() => setOpen(!open)}
            >
                <ProfileAvatar user={user} className="w-full h-full" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={styles.dropdown}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                            <ProfileAvatar user={user} className="w-12 h-12" initialsClass="text-lg font-black" />
                            <div className="flex flex-col min-w-0">
                                <div className="font-black text-gray-900 truncate leading-tight">{user.name}</div>
                                <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest truncate">{user.email}</div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            {menuItems.map(({ label, icon: Icon, key }) => (
                                <button
                                    key={key}
                                    className={styles.item}
                                    onClick={() => { setOpen(false); onMenuSelect?.(key); }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={16} className="text-gray-400 group-hover:text-blue-500" />
                                        {label}
                                    </div>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </button>
                            ))}
                        </div>

                        {/* Logout */}
                        <div className="p-2 border-t border-gray-100 bg-gray-50">
                            <button className={styles.logout} onClick={onLogout}>
                                <LogOut size={16} /> {t('profile_menu.logout')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};