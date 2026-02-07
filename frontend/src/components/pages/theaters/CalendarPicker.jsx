import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export const CalendarPicker = ({
                                   isOpen, setIsOpen, selectedDate, setSelectedDate,
                                   viewDate, setViewDate, todayStr, currentLocale, t, calendarRef
                               }) => {
    const adjustDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        const newDateStr = d.toISOString().split("T")[0];
        if (newDateStr < todayStr) return;
        setSelectedDate(newDateStr);
        setViewDate(new Date(newDateStr));
    };

    const changeViewMonth = (offset) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(viewDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const renderGrid = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOffset = new Date(year, month, 1).getDay();
        const offset = startOffset === 0 ? 6 : startOffset - 1;

        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(<div key={`empty-${i}`} className="h-12 w-12" />);
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isPast = dateStr < todayStr;
            cells.push(
                <button
                    key={day} disabled={isPast}
                    onClick={() => { setSelectedDate(dateStr); setIsOpen(false); }}
                    className={`h-12 w-12 rounded-2xl text-[16px] font-black transition-all active:scale-90 ${
                        isSelected ? "bg-blue-600 text-white shadow-xl scale-110" : isPast ? "text-slate-200 opacity-50" : "hover:bg-blue-50 text-slate-700"
                    }`}
                >
                    {day}
                </button>
            );
        }
        return cells;
    };

    return (
        <div className="relative" ref={calendarRef}>
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                <button onClick={() => adjustDate(-1)} disabled={selectedDate <= todayStr} className="p-3 disabled:opacity-20 hover:bg-slate-50 rounded-xl text-gray-400">
                    <ChevronLeft size={20}/>
                </button>
                <div onClick={() => { setViewDate(new Date(selectedDate)); setIsOpen(!isOpen); }} className="px-6 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-xl transition-all">
                    <Calendar size={20} className="text-blue-500" />
                    <span className="font-black text-[16px] uppercase tracking-widest text-slate-800">
                        {new Date(selectedDate).toLocaleDateString(currentLocale, { day: 'numeric', month: 'long' })}
                    </span>
                </div>
                <button onClick={() => adjustDate(1)} className="p-3 hover:bg-slate-50 rounded-xl text-gray-400"><ChevronRight size={20}/></button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="absolute top-full left-0 mt-4 p-8 bg-white rounded-[3rem] shadow-2xl border border-slate-100 z-[110] w-[400px]">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <button onClick={() => changeViewMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={24}/></button>
                            <div className="text-center">
                                <div className="font-black uppercase text-slate-900 text-xl">{viewDate.toLocaleDateString(currentLocale, { month: 'long' })}</div>
                                <div className="text-[10px] font-black text-blue-500 uppercase">{viewDate.getFullYear()}</div>
                            </div>
                            <button onClick={() => changeViewMonth(1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={24}/></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {t('calendar.days', { returnObjects: true }).map(d => (
                                <span key={d} className="text-[12px] font-black text-slate-300 text-center uppercase mb-4">{d}</span>
                            ))}
                            {renderGrid()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};