import React, { useState } from "react";
import { motion } from "framer-motion";
import { Home, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/Atoms";
import { styles } from "./ConfirmationStyles";
import { SuccessBadge } from "./SuccessBadge";

/**
 * Сторінка успішного підтвердження транзакції та генерації звітних документів.
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.setStep - Перемикання кроків (на головну сторінку).
 * @param {number|string} props.bookingId - Унікальний ідентифікатор транзакції для рендерингу PDF.
 * @returns {JSX.Element} Екран фіналізації замовлення.
 */
export const ConfirmationPage = ({ setStep, bookingId }) => {
    const { t } = useTranslation();
    const [isDownloading, setIsDownloading] = useState(false);

    /**
     * ### НАУКОВО-ПРИКЛАДНИЙ МОДУЛЬ: Отримання бінарного потоку.
     * Виконує асинхронний запит до API шару безпеки для отримання сгенерованого PDF файлу.
     * @async
     * @function handleDownloadPDF
     */
    const handleDownloadPDF = async () => {
        console.log('Booking ID:', bookingId);
        console.log('Token exists:', !!localStorage.getItem('authToken'));
        const currentBookingId = bookingId || localStorage.getItem('lastBookingId');

        if (!currentBookingId) {
            alert("Помилка: ID бронювання не знайдено. Ви можете завантажити квиток з історії в особистому кабінеті.");
            return;
        }

        try {
            setIsDownloading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`http://localhost:5000/api/bookings/${currentBookingId}/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Не вдалося завантажити файл квитка");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `ticket-${currentBookingId}.pdf`;
            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Помилка завантаження PDF:', err);
            alert("Не вдалося завантажити PDF-квиток. Перевірте з'єднання з сервером.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center min-h-[50vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`${styles.card} w-full text-center flex flex-col items-center p-8 md:p-12 relative overflow-hidden`}
            >
                <div className={styles.glow} />

                <div className="relative z-10 flex flex-col items-center space-y-8 w-full">
                    <div className="flex justify-center w-full">
                        <SuccessBadge />
                    </div>

                    <div className="space-y-3 text-center w-full flex flex-col items-center">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight max-w-md text-center">
                            {t('booking.confirm_title')}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium max-w-sm text-center">
                            {t('booking.confirm_subtitle') || "Ваше замовлення успішно оформлено. Електронний квиток з QR-кодом сформовано."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 w-full max-w-md">
                        <button
                            onClick={() => setStep("home")}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl transition-all font-bold shadow-sm text-xs uppercase tracking-wider whitespace-nowrap"
                        >
                            <Home size={16} />
                            {t('profile.buttons.home')}
                        </button>

                        <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl transition-all font-bold shadow-sm text-xs uppercase tracking-wider disabled:opacity-50 whitespace-nowrap"
                        >
                            {isDownloading ? (
                                <Loader2 size={16} className="animate-spin text-blue-600" />
                            ) : (
                                <Download size={16} className="text-blue-600" />
                            )}
                            {isDownloading ? "Завантаження..." : t('booking.download_pdf') || "Квиток PDF"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};