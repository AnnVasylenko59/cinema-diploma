import React from "react";
import { motion } from "framer-motion";
import { Home, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/Atoms";
import { styles } from "./ConfirmationStyles";
import { SuccessBadge } from "./SuccessBadge";

export const ConfirmationPage = ({ setStep }) => {
    const { t } = useTranslation();

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={styles.card}
            >
                {/* Ефект світіння - такий самий, як ми робили в SeatPicker */}
                <div className={styles.glow} />

                <div className="relative z-10 space-y-10">
                    <SuccessBadge />

                    <div className="space-y-4">
                        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 uppercase tracking-tight leading-tight">
                            {t('booking.confirm_title')}
                        </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button
                            onClick={() => setStep("home")}
                            className={styles.btnHome}
                        >
                            <Home size={18} />
                            {t('profile.buttons.home')}
                        </Button>

                        <Button
                            variant="ghost"
                            className={styles.btnDownload}
                        >
                            <Download size={18} />
                            {t('booking.download_pdf') || "Квиток PDF"}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};