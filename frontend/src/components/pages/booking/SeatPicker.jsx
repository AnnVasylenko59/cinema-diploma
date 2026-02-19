import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Screen from "./Screen.jsx";
import Seat from "./Seat.jsx";
import BookingLegend from "./BookingLegend.jsx";

/**
 * Компонент для візуального вибору місць у кінозалі.
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Object} props.showtime - Об'єкт сеансу, що містить дані про залу та місця.
 * @param {Array<string>} props.selectedSeats - Масив ідентифікаторів обраних місць (ряд-місце).
 * @param {Function} props.setSelectedSeats - Функція для оновлення стану обраних місць.
 * @returns {JSX.Element} Інтерфейс вибору місць із екраном та легендою.
 */
export const SeatPicker = ({ showtime, selectedSeats, setSelectedSeats }) => {
    const { t } = useTranslation();
    const hall = showtime?.hall;
    const allSeats = hall?.seats || [];

    const rows = useMemo(() => {
        const seats = showtime?.hall?.seats || [];
        return [...new Set(seats.map(s => s.rowNum))].sort((a, b) => a - b);
    }, [showtime]);

    const toggleSeat = (seat) => {
        if (seat.isOccupied) return;
        const seatKey = `${seat.rowNum}-${seat.seatNum}`;
        setSelectedSeats(prev =>
            prev.includes(seatKey)
                ? prev.filter(s => s !== seatKey)
                : [...prev, seatKey]
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <Screen label={t('booking.screen_label')} />

            <div className="flex flex-col gap-2 items-center overflow-x-auto pb-8 custom-inner-scrollbar">
                {rows.map(rowNum => (
                    <div key={rowNum} className="flex gap-4 items-center">
                        <span className="w-6 text-[10px] font-black text-slate-300 text-right">{rowNum}</span>

                        <div className="flex gap-2">
                            {allSeats
                                .filter(s => s.rowNum === rowNum)
                                .sort((a, b) => a.seatNum - b.seatNum)
                                .map(seat => (
                                    <Seat
                                        key={seat.id}
                                        seat={seat}
                                        isSelected={selectedSeats.includes(`${seat.rowNum}-${seat.seatNum}`)}
                                        onToggle={toggleSeat}
                                    />
                                ))
                            }
                        </div>

                        <span className="w-6 text-[10px] font-black text-slate-300 ml-2">{rowNum}</span>
                    </div>
                ))}
            </div>

            <BookingLegend />
        </div>
    );
};