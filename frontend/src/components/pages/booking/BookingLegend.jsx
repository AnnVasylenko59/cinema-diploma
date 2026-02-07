import React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { classNames } from "../../../utils/index.js";

const LegendItem = ({ label, color, icon }) => (
    <div className="flex items-center gap-3">
        <div className={classNames("w-5 h-5 rounded-lg border-2 flex items-center justify-center shadow-sm", color)}>
            {icon}
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
            {label}
        </span>
    </div>
);

const BookingLegend = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 py-8 mt-4 border-t border-slate-50">
            <LegendItem label={t('booking.legend.available')} color="bg-gray-100 border-gray-300" />
            <LegendItem label={t('booking.legend.vip')} color="bg-amber-100 border-amber-300" />
            <LegendItem label={t('booking.legend.selected')} color="bg-blue-600 border-blue-600" />
            <LegendItem
                label={t('booking.legend.occupied')}
                color="bg-slate-800 border-slate-800"
                icon={<X size={10} className="text-slate-500" />}
            />
        </div>
    );
};

export default BookingLegend;