export const slideVariants = {
    enter: (direction) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0, scale: 1.1
    }),
    center: {
        x: 0, opacity: 1, scale: 1,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    },
    exit: (direction) => ({
        x: direction < 0 ? "100%" : "-100%",
        opacity: 0, scale: 0.9,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }),
};

export const textVariants = {
    enter: { y: 40, opacity: 0 },
    center: { y: 0, opacity: 1, transition: { delay: 0.3, duration: 0.6 } },
    exit: { y: -40, opacity: 0, transition: { duration: 0.4 } }
};

export const styles = {
    badge: "flex items-center gap-1.5 px-3 py-1 backdrop-blur-md rounded-full border",
    navBtn: "w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all active:scale-90"
};