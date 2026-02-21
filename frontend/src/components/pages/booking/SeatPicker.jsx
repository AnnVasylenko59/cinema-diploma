import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Screen from "./Screen.jsx";
import Seat from "./Seat.jsx";
import BookingLegend from "./BookingLegend.jsx";

/**
 * @component
 * @description
 * ### АЛГОРИТМ ВІЗУАЛІЗАЦІЇ ЗАЛИ :
 * Реалізує складну логіку перетворення нормалізованого списку місць у двовимірну сітку:
 * 1. **Data Grouping**: Використовує `Set` всередині `useMemo` для вилучення унікальних номерів рядів (Row IDs).
 * 2. **Optimization**: Кешує результат групування (`rows`), щоб уникнути важких обчислень при зміні вибору окремого місця.
 * 3. **Grid Rendering**: Для кожного ряду виконується вторинна фільтрація та сортування місць (`seatNum`), що дозволяє коректно відображати "проходи" та вигини зали.
 * * ### ВЗАЄМОДІЯ МІЖ КОМПОНЕНТАМИ:
 * Працює за патерном **Controlled Component**. Стан вибору не зберігається всередині, а піднімається (Lifting State Up) до `BookingPage`.
 * Це дозволяє синхронізувати дані між цим компонентом та боковою панеллю підрахунку ціни.
 *
 * @param {Object} props - Властивості компонента.
 * @param {Object} props.showtime - Об'єкт сеансу з повною схемою зали.
 * @param {Array<string>} props.selectedSeats - Список ключів обраних місць у форматі "рядок-номер".
 * @param {Function} props.setSelectedSeats - Функція-обробник для синхронізації стану з батьківським компонентом.
 * @returns {JSX.Element}
 */
export const SeatPicker = ({ showtime, selectedSeats, setSelectedSeats }) => {
    const { t } = useTranslation();
    const hall = showtime?.hall;
    const allSeats = hall?.seats || [];

    /**
     * СКЛАДНИЙ АЛГОРИТМ: Формування структури рядів.
     * Запобігає зайвим перерахункам при кліках на місця.
     */
    const rows = useMemo(() => {
        const seats = showtime?.hall?.seats || [];
        return [...new Set(seats.map(s => s.rowNum))].sort((a, b) => a - b);
    }, [showtime]);

    /**
     * ### БІЗНЕС-ЛОГІКА ВИБОРУ:
     * Реалізує механізм перемикання (Toggle).
     * 1. **Валідація**: Блокує будь-яку взаємодію з місцями, де `isOccupied: true`.
     * 2. **Ідентифікація**: Формує унікальний `seatKey` для уникнення колізій між залами.
     * 3. **Living Documentation**: Поведінка цього методу описана в тестах:
     * @see frontend/features/search.feature (Сценарій: "Вибір вільних місць")
     */
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