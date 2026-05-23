import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Film, Calendar, MapPin, Ticket, Clock } from "lucide-react";
import axios from "axios";

export const TicketValidationPage = ({ bookingId }) => {
    const [status, setStatus] = useState({ loading: true, valid: null, data: null, error: null });

    useEffect(() => {
        const validate = async () => {
            try {
                const currentHost = window.location.hostname;

                const res = await axios.get(`http://${currentHost}:5000/api/bookings/${bookingId}/validate`);

                if (res.data.valid) {
                    setStatus({ loading: false, valid: true, data: res.data, error: null });
                } else {
                    setStatus({ loading: false, valid: false, data: res.data, error: res.data.message });
                }
            } catch (err) {
                console.error("Деталі помилки сканування:", err);
                setStatus({
                    loading: false,
                    valid: false,
                    data: null,
                    error: err.response?.data?.message || "Помилка мережевого з'єднання з сервером кінотеатру"
                });
            }
        };
        if (bookingId) validate();
    }, [bookingId]);

    // Функція для гарного форматування часу сканування або сеансу
    const formatTime = (isoString) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    };

    if (status.loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Перевірка електронного квитка...</p>
            </div>
        );
    }

    // Показуємо картку з деталями, якщо вхід успішний АБО якщо квиток просто вже використаний (повторний прохід)
    const shouldShowDetails = status.valid || status.data?.alreadyUsed;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-white/60 space-y-6">

                {/* Статус-Блок */}
                <div className="text-center space-y-3">
                    {status.valid ? (
                        <div className="flex flex-col items-center space-y-2">
                            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 animate-bounce">
                                <CheckCircle2 size={44} />
                            </div>
                            <h2 className="text-2xl font-black text-emerald-600 uppercase tracking-tight">Вхід дозволено</h2>
                            <p className="text-xs text-slate-400 font-medium">{status.data.message}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-2">
                            <div className={`p-4 rounded-full border ${status.data?.alreadyUsed ? "bg-amber-50 text-amber-500 border-amber-100 animate-pulse" : "bg-red-50 text-red-500 border-red-100"}`}>
                                {status.data?.alreadyUsed ? <AlertTriangle size={44} /> : <XCircle size={44} />}
                            </div>
                            <h2 className={`text-2xl font-black uppercase tracking-tight ${status.data?.alreadyUsed ? "text-amber-600" : "text-red-600"}`}>
                                {status.data?.alreadyUsed ? "Повторний прохід" : "Вхід заборонено"}
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold px-4">{status.error}</p>
                        </div>
                    )}
                </div>

                {/* Деталі квитка (Відображаються для валідних та вже використаних квитків) */}
                {shouldShowDetails && status.data && (
                    <div className="bg-slate-50/70 p-6 rounded-[1.8rem] border border-slate-100 space-y-4">

                        {/* Блок Фільму */}
                        <div className="flex items-start gap-3 border-b border-slate-200/50 pb-3">
                            <Film size={18} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Фільм</div>
                                <div className="text-sm font-black text-slate-800 uppercase mt-0.5">{status.data.movieTitle}</div>
                            </div>
                        </div>

                        {/* 🔥 НОВИЙ БЛОК: Час першого сканування (лише для повторного проходу) */}
                        {status.data.alreadyUsed && status.data.scannedAt && (
                            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2.5 rounded-2xl border border-amber-100/70 text-xs font-bold">
                                <Clock size={16} className="text-amber-600 shrink-0" />
                                <span>Перший вхід здійснено о: <span className="text-sm font-black text-amber-600">{formatTime(status.data.scannedAt)}</span></span>
                            </div>
                        )}

                        {/* Блок Кінотеатру з Містом */}
                        <div className="flex items-start gap-3 border-b border-slate-200/50 pb-3">
                            <MapPin size={18} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Кінотеатр</div>
                                <div className="text-xs font-bold text-slate-700 mt-0.5">
                                    м. {status.data.cityName}, {status.data.theaterName}
                                </div>
                            </div>
                        </div>

                        {/* Блок Сеансу та Залу в один ряд */}
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-200/50 pb-3">
                            <div className="flex items-start gap-2.5">
                                <Calendar size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                <div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Сеанс</div>
                                    <div className="text-xs font-bold text-slate-700 mt-0.5">
                                        {formatTime(status.data.startTime)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="w-4 h-4 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-[9px] mt-0.5 shrink-0">
                                    H
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Зал</div>
                                    <div className="text-xs font-bold text-slate-700 mt-0.5">{status.data.hallName}</div>
                                </div>
                            </div>
                        </div>

                        {/* Блок Місць */}
                        <div className="flex items-start gap-3">
                            <Ticket size={18} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Місця (всього: {status.data.ticketsCount || 1})</div>
                                <div className="text-xs font-bold text-slate-700 mt-1 bg-white px-3 py-1.5 rounded-xl border border-slate-150">
                                    {status.data.seats}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Підвал квитка */}
                <div className="text-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Бронювання # {bookingId}
                    </span>
                </div>
            </div>
        </div>
    );
};