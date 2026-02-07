import React from "react";
import { useTranslation } from "react-i18next";
import { MovieCard } from "./MovieCard";

export const MoviesGrid = ({ movies, onOpenMovie, watchlistIds = [], onToggleWatchlist }) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {movies.map((m) => (
                <MovieCard
                    key={m.id}
                    movie={m}
                    isFavorite={watchlistIds.includes(m.id)}
                    onOpen={onOpenMovie}
                    onToggleWatchlist={onToggleWatchlist}
                    t={t}
                />
            ))}
        </div>
    );
};