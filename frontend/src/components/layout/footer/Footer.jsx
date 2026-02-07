import React from "react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="mx-auto max-w-7xl px-4 py-8 text-sm opacity-70">
            <div>
                © {new Date().getFullYear()} {t('footer.project_info')}
            </div>
        </footer>
    );
};