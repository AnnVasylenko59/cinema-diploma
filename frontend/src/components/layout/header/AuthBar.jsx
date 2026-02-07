import React from "react";
import { LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/Atoms";
import { LanguageToggle } from "../../ui/LanguageToggle.jsx";
import { ThemeToggle } from "../../ui/ThemeToggle";
import { ProfileMenu } from "../profile/ProfileMenu.jsx";

export const AuthBar = ({ user, onLogout, onOpenLoginModal, onMenuSelect, theme, setTheme }) => {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-2 whitespace-nowrap">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <LanguageToggle />

            <div className="h-6 w-px bg-slate-200 mx-1 hidden xs:block" />

            {user ? (
                <ProfileMenu user={user} onLogout={onLogout} onMenuSelect={onMenuSelect} />
            ) : (
                <Button
                    variant="ghost"
                    onClick={onOpenLoginModal}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all"
                >
                    <LogIn size={18} className="text-gray-400" />
                    <span className="hidden xs:inline">{t('header.login')}</span>
                </Button>
            )}
        </div>
    );
};