import React from "react";
import { MapPin, Calendar } from "lucide-react";
import { styles } from "./HistoryStyles";
import { Card, Badge } from "../../../ui/Atoms";

export const BookingItem = ({ booking, t, locale }) => {
    const movie = booking.showtime.movie;

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

                <div className="flex flex-wrap gap-2 pt-1">
                    {booking.tickets.map((ticket) => (
                        <Badge key={ticket.id} variant="default" className="!lowercase">
                            <span className="opacity-40 uppercase mr-1">{t('bookings.row')}</span>
                            {ticket.seat.rowNum}
                            <span className="mx-1 opacity-20">|</span>
                            <span className="opacity-40 uppercase mr-1">{t('bookings.seat')}</span>
                            {ticket.seat.seatNum}
                        </Badge>
                    ))}
                </div>

                <div className="mt-2 pt-3 border-t border-slate-200/60 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        # {booking.id}
                    </span>

                    <Badge variant="success">
                        {t('bookings.confirmed')}
                    </Badge>
                </div>
            </div>
        </Card>
    );
};