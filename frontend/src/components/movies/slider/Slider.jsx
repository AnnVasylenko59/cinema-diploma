import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SlideBackdrop } from "./SlideBackdrop";
import { SlideContent } from "./SlideContent";

export const Slider = ({ items, onWatchTrailer }) => {
    const { t } = useTranslation();
    const [i, setI] = useState(0);
    const [direction, setDirection] = useState(0);

    const next = useCallback(() => {
        setDirection(1);
        setI((p) => (p + 1) % items.length);
    }, [items?.length]);

    const prev = useCallback(() => {
        setDirection(-1);
        setI((p) => (p - 1 + items.length) % items.length);
    }, [items?.length]);

    useEffect(() => {
        if (items?.length > 1) {
            const id = setInterval(next, 10000);
            return () => clearInterval(id);
        }
    }, [i, next, items?.length]);

    if (!items?.length) return null;

    return (
        <div className="relative w-full overflow-hidden rounded-[3rem] border border-white/5 shadow-2xl bg-slate-950 aspect-[16/9] md:aspect-auto md:h-[550px] group">
            <AnimatePresence initial={false} custom={direction}>
                <SlideBackdrop item={items[i]} i={i} direction={direction} />
            </AnimatePresence>

            <AnimatePresence initial={false} custom={direction} mode="wait">
                <SlideContent
                    item={items[i]} i={i} t={t}
                    next={next} prev={prev} onWatchTrailer={onWatchTrailer}
                />
            </AnimatePresence>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {items.map((_, idx) => (
                    <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === i ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                ))}
            </div>
        </div>
    );
};