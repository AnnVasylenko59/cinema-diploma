import React, { useMemo, useEffect, useState } from "react";
import { MapPin, Info, CalendarX, MoveRight } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";

import { EmptyState } from "../../ui/EmptyState";

const createCustomIcon = (isSelected) => new L.DivIcon({
    html: `
        <div class="relative flex items-center justify-center">
            ${isSelected ? '<div class="absolute w-10 h-10 bg-blue-400 rounded-full opacity-30 animate-ping"></div>' : ''}
            <div class="relative z-10 w-9 h-9 bg-white rounded-full border-2 ${isSelected ? 'border-blue-600' : 'border-red-500'} flex items-center justify-center shadow-xl transform transition-all duration-300 ${isSelected ? 'scale-125' : 'hover:scale-110'}">
                <svg viewBox="0 0 24 24" class="w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-red-500'}" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-6-7-13zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            </div>
        </div>
    `,
    className: 'custom-marker-container',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

function MapController({ city, selectedTheaterCoords }) {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedTheaterCoords) {
                map.flyTo(selectedTheaterCoords, 15, { duration: 1.5, easeLinearity: 0.25 });
            } else if (city?.lat && city?.lng) {
                map.flyTo([city.lat, city.lng], 12, { duration: 1.5, easeLinearity: 0.25 });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [city, selectedTheaterCoords, map]);
    return null;
}

export const TheatersMap = ({
                                theaters = [],
                                showtimes = [],
                                selectedCity,
                                onPickShowtime,
                                nextDate,
                                onGoToDate
                            }) => {
    const { t, i18n } = useTranslation();
    const [selectedTheaterId, setSelectedTheaterId] = useState(null);
    const currentLocale = i18n.language === 'en' ? 'en-US' : 'uk-UA';

    const formattedNextDate = nextDate ? new Date(nextDate).toLocaleDateString(currentLocale, {
        day: 'numeric',
        month: 'long'
    }) : null;

    const theatersWithCoords = useMemo(() => {
        if (!Array.isArray(theaters)) return [];
        return theaters
            .filter(item => item.coords && typeof item.coords === 'string')
            .map(item => {
                const parts = item.coords.split(',');
                if (parts.length !== 2) return null;
                return { ...item, lat: Number(parts[0]), lng: Number(parts[1]) };
            })
            .filter(Boolean);
    }, [theaters]);

    const activeCoords = useMemo(() => {
        if (!selectedTheaterId) return null;
        const found = theatersWithCoords.find(item => item.id === selectedTheaterId);
        return found ? [found.lat, found.lng] : null;
    }, [selectedTheaterId, theatersWithCoords]);

    return (
        <div className="flex flex-col lg:flex-row h-[600px] w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">

            {/* ЛІВА ЧАСТИНА: ІНТЕРАКТИВНА МАПА */}
            <div className="flex-[2.5] relative z-10 border-r border-slate-50">
                <MapContainer
                    center={[selectedCity.lat, selectedCity.lng]}
                    zoom={12}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                >
                    <MapController city={selectedCity} selectedTheaterCoords={activeCoords} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                    {theatersWithCoords.map((theater) => (
                        <Marker
                            key={theater.id}
                            position={[theater.lat, theater.lng]}
                            icon={createCustomIcon(selectedTheaterId === theater.id)}
                            eventHandlers={{ click: () => setSelectedTheaterId(theater.id) }}
                        >
                            <Popup closeButton={false}>
                                <div className="p-1 font-black text-xs uppercase tracking-tighter">{theater.name}</div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* ПРАВА ЧАСТИНА: САЙДБАР */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6 flex flex-col min-w-0">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2">
                    {t('theaters_map.sidebar_title')}
                </h4>

                <div className="flex-1 space-y-3 custom-inner-scrollbar pr-1 flex flex-col min-h-0">
                    {showtimes.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-500 text-center px-4">
                            <EmptyState
                                variant="simple"
                                icon={CalendarX}
                                title={t('theaters.no_sessions_title')}
                                description={nextDate ? (
                                    <button
                                        onClick={() => onGoToDate(nextDate)}
                                        className="group flex items-center justify-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:text-blue-700 transition-all mx-auto mt-2"
                                    >
                                        <span>{t('theaters.next_session_prefix')} {formattedNextDate}</span>
                                        <MoveRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                                    </button>
                                ) : t('theaters.no_sessions_text')}
                            />
                        </div>
                    ) : theatersWithCoords.length > 0 ? (
                        theatersWithCoords.map((theater) => {
                            const theaterShowtimes = Array.isArray(showtimes)
                                ? showtimes.filter(s => s.hall?.theaterId === theater.id)
                                : [];
                            const isSelected = selectedTheaterId === theater.id;

                            return (
                                <div
                                    key={theater.id}
                                    onClick={() => setSelectedTheaterId(theater.id)}
                                    className={`p-4 rounded-[2rem] transition-all cursor-pointer border ${
                                        isSelected ? 'bg-white border-blue-100 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                                            <MapPin size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-black text-slate-800 text-sm tracking-tight truncate uppercase">{theater.name}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase truncate">{theater.address}</div>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                                            {theaterShowtimes.length > 0 ? (
                                                theaterShowtimes.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={(e) => { e.stopPropagation(); onPickShowtime(s); }}
                                                        className="flex flex-col items-center py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <span className="text-xs font-black">
                                                            {new Date(s.startTime).toLocaleTimeString(currentLocale, {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                        <span className="text-[9px] font-bold opacity-60 uppercase">
                                                            {s.price}{t('booking.currency')}
                                                        </span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="col-span-2 py-4 flex flex-col items-center justify-center bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                                                    <Info size={16} className="text-slate-400 mb-1" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-2">
                                                        {t('theaters_map.no_showtimes_in_this_theater')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 opacity-20">
                            <Info size={40} className="mx-auto text-slate-300" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};