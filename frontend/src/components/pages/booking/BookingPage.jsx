import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Ticket, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SeatPicker } from "./SeatPicker.jsx";
import { PageHeader } from "../PageHeader.jsx";
import { LoadingState } from "../LoadingState.jsx";
import { BookingSummary } from "./BookingSummary.jsx";
import { ErrorState } from "../../ui/ErrorState.jsx";

export const BookingPage = ({ chosenShowtime, setStep, onConfirmSeats }) => {
    const { t, i18n } = useTranslation();
    const [fullShowtime, setFullShowtime] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const currentLocale = i18n.language === 'en' ? 'en-US' : 'uk-UA';
    const isPastSession = new Date(chosenShowtime.startTime) < new Date();

    const fetchSeats = useCallback(async () => {
        if (isPastSession) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(false);

        try {
            const res = await axios.get(`http://localhost:5000/api/bookings/showtime/${chosenShowtime.id}`);
            setFullShowtime(res.data);
        } catch (err) {
            setError(true);
        } finally {
            setIsLoading(false);
        }
    }, [chosenShowtime?.id, isPastSession]);

    useEffect(() => {
        if (chosenShowtime?.id) fetchSeats();
    }, [chosenShowtime?.id, fetchSeats]);

    if (isPastSession) {
        return <ErrorState
            title={t('booking.session_expired_title')}
            icon={AlertTriangle}
            onBack={() => setStep("theaters")}
        />;
    }

    if (error) return <ErrorState onRetry={fetchSeats} onBack={() => setStep("theaters")} />;

    if (isLoading) return <LoadingState label={t('theaters.sync')} />;

    if (!fullShowtime) return null;

    return (
        <div className="max-w-6xl mx-auto px-4 py-2 animate-in fade-in duration-500 space-y-6">
            <PageHeader
                title={fullShowtime.movie?.title}
                subtitle={t('booking.title')}
                icon={Ticket}
                onBack={() => setStep("theaters")}
                backLabel={t('booking.back_to_sessions')}
            />

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Основна зона вибору місць */}
                <div className="flex-grow bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden">
                    <SeatPicker
                        showtime={fullShowtime}
                        selectedSeats={selectedSeats}
                        setSelectedSeats={setSelectedSeats}
                    />
                </div>

                {/* Винесена бокова панель */}
                <BookingSummary
                    fullShowtime={fullShowtime}
                    selectedSeats={selectedSeats}
                    onConfirm={onConfirmSeats}
                    locale={currentLocale}
                />
            </div>
        </div>
    );
};