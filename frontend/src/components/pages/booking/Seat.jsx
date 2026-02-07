import React from "react";
import { motion } from "framer-motion";
import { Armchair, X } from "lucide-react";
import { classNames } from "../../../utils/index.js";

const Seat = ({ seat, isSelected, onToggle }) => {
    const isTaken = seat.isOccupied;
    const isVip = seat.type === 'vip';

    const stateClasses = isTaken
        ? "bg-slate-800 border-slate-800 text-slate-500 shadow-inner shadow-black/20"
        : isSelected
            ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30"
            : isVip
                ? "bg-amber-100 border-amber-300 text-amber-700 hover:border-amber-500 hover:bg-amber-200"
                : "bg-gray-100 border-gray-300 text-gray-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600";

    return (
        <motion.button
            whileHover={!isTaken ? { scale: 1.15 } : {}}
            whileTap={!isTaken ? { scale: 0.95 } : {}}
            onClick={() => onToggle(seat)}
            disabled={isTaken}
            className={classNames(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2",
                stateClasses
            )}
        >
            {isTaken ? (
                <X size={18} strokeWidth={3} />
            ) : (
                <Armchair
                    size={18}
                    fill={isSelected ? "currentColor" : "none"}
                    strokeWidth={2}
                />
            )}
        </motion.button>
    );
};

export default Seat;