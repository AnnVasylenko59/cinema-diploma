import React from "react";
import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Slider } from "../../movies/slider/Slider.jsx";
import { FiltersBar } from "../../movies/filters/FiltersBar.jsx";
import { MoviesGrid } from "../../movies/grid/MoviesGrid.jsx";

import { CatalogHeader } from "./CatalogHeader";
import { ErrorState } from "../../ui/ErrorState";
import { LoadingState } from "../LoadingState.jsx";
import { EmptyState } from "../../ui/EmptyState";

export const HomePage = ({
                             query, setQuery, selectedGenres, setSelectedGenres,
                             rating, setRating, time, setTime,
                             genres = [], filtered = [], movies = [],
                             loading, error, onOpenMovie, onWatchTrailer,
                             onRetry, watchlistIds, onToggleWatchlist
                         }) => {
    const { t } = useTranslation();
    const promoItems = movies.slice(0, 5);

    const resetFilters = () => {
        setQuery("");
        setSelectedGenres([]);
        setRating(0);
        setTime("any");
    };

    if (error) return <ErrorState onRetry={onRetry} />;

    return (
        <div className="space-y-10 pb-20">
            {/* 1. СЛАЙДЕР */}
            {!loading && promoItems.length > 0 && (
                <Slider items={promoItems} onWatchTrailer={onWatchTrailer} />
            )}

            {/* 2. БАР ФІЛЬТРІВ */}
            <div className="relative z-20">
                <FiltersBar
                    genres={genres}
                    selectedGenres={selectedGenres}
                    setSelectedGenres={setSelectedGenres}
                    rating={rating}
                    setRating={setRating}
                    time={time}
                    setTime={setTime}
                    query={query}
                    setQuery={setQuery}
                />
            </div>

            <section className="space-y-8">
                {/* 3. ЗАГОЛОВОК КАТАЛОГУ */}
                <CatalogHeader loading={loading} count={filtered.length} />

                {/* 4. ОСНОВНИЙ КОНТЕНТ */}
                {loading ? (
                    <LoadingState label={t('home.sync')} />
                ) : filtered.length > 0 ? (
                    <MoviesGrid
                        movies={filtered}
                        onOpenMovie={onOpenMovie}
                        watchlistIds={watchlistIds}
                        onToggleWatchlist={onToggleWatchlist}
                    />
                ) : (
                    <EmptyState
                        variant="dashed"
                        icon={SearchX}
                        title={t('home.not_found')}
                        description={t('home.not_found_desc')}
                        onAction={resetFilters}
                        actionLabel={t('home.reset_filters')}
                    />
                )}
            </section>
        </div>
    );
};