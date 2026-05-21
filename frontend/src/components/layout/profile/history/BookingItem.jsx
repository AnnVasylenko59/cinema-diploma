import React, { useMemo, useState } from "react";
import { MapPin, Calendar, Download } from "lucide-react";
import axios from "axios";
import { styles } from "./HistoryStyles";
import { Card, Badge } from "../../../ui/Atoms";

export const BookingItem = ({ booking, t, locale }) => {
    const movie = booking.showtime.movie;
    const [isDownloading, setIsDownloading] = useState(false);

    // Оптимізоване групування квитків за номерами рядів
    const groupedSeatsByRow = useMemo(() => {
        const rows = {};
        booking.tickets.forEach((ticket) => {
            const rNum = ticket.seat.rowNum;
            if (!rows[rNum]) rows[rNum] = [];
            rows[rNum].push(ticket.seat.seatNum);
        });

        return Object.keys(rows)
            .sort((a, b) => Number(a) - Number(b))
            .map(rowNum => ({
                rowNum,
                seats: rows[rowNum].sort((a, b) => a - b)
            }));
    }, [booking.tickets]);

    // Функція для скачування PDF квитка
    const handleDownloadPdf = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const token = localStorage.getItem('authToken');
            // Визначаємо мову для бекенду (uk або en)
            const lang = locale.startsWith('uk') ? 'uk' : 'en';

            const response = await axios.get(`http://localhost:5000/api/bookings/${booking.id}/pdf?lang=${lang}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob' // Критично для роботи з бінарними даними (PDF)
            });

            // Створення тимчасового посилання для скачування файлу
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ticket-${booking.id}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Очищення пам'яті
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Помилка при завантаженні PDF:", error);
            alert("Не вдалося завантажити квиток. Спробуйте пізніше.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Card className={`${styles.card} !rounded-[2rem] hover:border-blue-200 transition-all`}>
            {/* Постер */}
            <div className={styles.poster}>
                <img
                    src={movie.posterUrl || movie.poster}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300x450?text=Error"; }}
                />
            </div>

            <div className="flex-1 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-lg uppercase leading-none tracking-tight">
                    {movie.title}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                        <MapPin size={15} className="text-blue-500"/>
                        {booking.showtime.hall.theater.name}
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                        <Calendar size={15} className="text-blue-500"/>
                        {new Date(booking.showtime.startTime).toLocaleDateString(locale, {
                            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                        })}
                    </div>
                </div>

                {/* Компактний блок відображення згрупованих місць */}
                <div className="flex flex-col gap-1.5 pt-1">
                    {groupedSeatsByRow.map(({ rowNum, seats }) => (
                        <div key={rowNum} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100/50">
                            <span className="font-bold text-blue-600 uppercase text-[10px] tracking-wider shrink-0">
                                {t('bookings.row') || 'Ряд'} {rowNum}:
                            </span>
                            <span className="font-semibold text-slate-600 truncate">
                                {t('bookings.seat') || 'Місця'} {seats.join(", ")}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Нижня панель: ID, Статус та Кнопка скачування */}
                <div className="mt-2 pt-3 border-t border-slate-200/60 flex justify-between items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        # {booking.id}
                    </span>

                    <div className="flex items-center gap-2">
                        {/* Кнопка завантаження PDF */}
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 disabled:opacity-50"
                            title="Завантажити квиток у PDF"
                        >
                            <Download size={14} className={isDownloading ? "animate-bounce" : ""} />
                            <span>{isDownloading ? "..." : (t('bookings.download_pdf') || 'PDF')}</span>
                        </button>

                        <Badge variant="success">
                            {t('bookings.confirmed')}
                        </Badge>
                    </div>
                </div>
            </div>
        </Card>
    );
};