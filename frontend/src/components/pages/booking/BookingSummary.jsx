import React from "react";
import { MapPin, Clock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const BookingSummary = ({ fullShowtime, selectedSeats, onConfirm, locale }) => {
    const { t } = useTranslation();
    const totalPrice = selectedSeats.length * fullShowtime.price;

    return (
        <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 blur-[40px] rounded-full -mr-8 -mt-8 pointer-events-none" />

                <h4 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 mb-6 border-b border-slate-50 pb-4 text-center">
                    {t('bookings.title')}
                </h4>

                <div className="space-y-6 mb-8 relative z-10">
                    <div className="flex flex-col items-center text-center gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                            <MapPin size={12} /> {t('bookings.hall_placeholder')}
                        </div>
                        <p className="text-slate-900 font-bold text-[13px] uppercase leading-tight">
                            {fullShowtime.hall?.theater?.name} • <span className="text-blue-600">{fullShowtime.hall?.name}</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1 pb-4 border-b border-slate-50">
                        <div className="flex items-center gap-1.5 text-slate-400 uppercase font-bold text-[9px] tracking-widest">
                            <Clock size={12} /> {t('booking.showtime')}
                        </div>
                        <p className="text-slate-900 font-bold text-[13px]">
                            {new Date(fullShowtime.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">
                            {t('bookings.seats')}
                        </span>
                        <div className="flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto px-2 custom-inner-scrollbar">
                            {selectedSeats.length > 0 ? (
                                selectedSeats.map(seatKey => {
                                    const [row, num] = seatKey.split('-');
                                    return (
                                        <div key={seatKey} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-extrabold text-slate-700">
                                            {t('bookings.row')} {row} / {num}
                                        </div>
                                    );
                                })
                            ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase italic">{t('booking.no_seats_selected')}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 pt-4">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                            {t('booking.total_cost')}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-slate-900">{totalPrice}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase">₴</span>
                        </div>
                    </div>
                </div>

                <button
                    disabled={selectedSeats.length === 0}
                    onClick={() => onConfirm(selectedSeats)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-50 disabled:text-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
                >
                    <CheckCircle2 size={18} />
                    {t('booking.confirm')}
                </button>
            </div>
        </div>
    );
};