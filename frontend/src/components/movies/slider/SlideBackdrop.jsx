import React from "react";
import { motion } from "framer-motion";
import { Film } from "lucide-react";
import { slideVariants } from "./SliderStyles";

export const SlideBackdrop = ({ item, i, direction }) => (
    <motion.div
        key={i}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="absolute inset-0"
    >
        {item.backdropUrl || item.posterUrl || item.poster ? (
            <img
                src={item.backdropUrl || item.posterUrl || item.poster}
                alt={item.title}
                className="h-full w-full object-cover object-top"
            />
        ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-900">
                <Film size={80} className="text-white opacity-10" />
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent hidden md:block" />
    </motion.div>
);