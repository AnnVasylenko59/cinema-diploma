import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { styles, badgeVariants } from "./ConfirmationStyles";

export const SuccessBadge = () => (
    <div className="flex justify-center">
        <motion.div
            initial={badgeVariants.initial}
            animate={badgeVariants.animate}
            transition={badgeVariants.transition}
            className={styles.badge}
        >
            <CheckCircle2 size={48} strokeWidth={2.5} />
        </motion.div>
    </div>
);