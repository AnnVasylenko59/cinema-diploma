import React from "react";
import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

import * as Sentry from "@sentry/react";

import { Slider } from "../../movies/slider/Slider.jsx";
import { FiltersBar } from "../../movies/filters/FiltersBar.jsx";
import { MoviesGrid } from "../../movies/grid/MoviesGrid.jsx";

import { CatalogHeader } from "./CatalogHeader";
import { ErrorState } from "../../ui/ErrorState";
import { LoadingState } from "../LoadingState.jsx";
import { EmptyState } from "../../ui/EmptyState";

import { logAPI } from "../../../services/api.js";
// Імпортуємо наш хук, щоб сторінка працювала автономно
import { useFilters } from "../../../hooks/useFilters";

/**
 * Головна сторінка каталогу фільмів із вбудованою автономною фільтрацією.
 * @component
 */
export const HomePage = ({
                             genres = [],
                             onOpenMovie,
                             onWatchTrailer,
                             watchlistIds,
                             onToggleWatchlist
                         }) => {
    const { t } = useTranslation();

    const {
        query, setQuery,
        selectedGenres, setSelectedGenres,
        duration, setDuration,
        movies, filtered,
        loading, error
    } = useFilters();

    const promoItems = movies.slice(0, 5);

    // Функція скидання фільтрів
    const resetFilters = () => {
        setQuery("");
        setSelectedGenres([]);
        setDuration("any");
    };

    if (error) {
        const errorType = !navigator.onLine || error?.message?.includes('Network') ? 'network' : '500';
        return (
            <ErrorState
                type={errorType}
                onRetry={() => window.location.reload()}
                onReport={() => {
                    logAPI.sendError("Користувач повідомив про проблему на сторінці Каталогу", {
                        page: "HomePage",
                        errorType: errorType,
                        action: "User clicked report button"
                    });

                    const eventId = Sentry.captureMessage("User Feedback: Issue on HomePage");

                    Sentry.showReportDialog({
                        eventId,
                        title: "Повідомити про проблему",
                        subtitle: "Будь ласка, опишіть кроки, які призвели до цієї помилки.",
                        subtitle2: "Це допоможе нам швидко все полагодити.",
                        labelName: "Ваше ім'я",
                        labelEmail: "Ваш Email",
                        labelComments: "Що пішло не так? (Кроки відтворення)",
                        labelSubmit: "Відправити звіт",
                        labelClose: "Закрити",
                        successMessage: "Дякуємо! Ваш звіт та технічні дані успішно відправлено."
                    });
                }}
            />
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* 1. СЛАЙДЕР СВІЖИХ ПРЕМ'ЄР */}
            {!loading && promoItems.length > 0 && (
                <Slider items={promoItems} onWatchTrailer={onWatchTrailer} />
            )}

            {/* 2. БАР ФІЛЬТРІВ */}
            <div className="relative z-20">
                <FiltersBar
                    genres={genres}
                    selectedGenres={selectedGenres}
                    setSelectedGenres={setSelectedGenres}
                    duration={duration}
                    setDuration={setDuration}
                    query={query}
                    setQuery={setQuery}
                />
            </div>

            <section className="space-y-8">
                {/* 3. ДИНАМІЧНИЙ ЗАГОЛОВОК КАТАЛОГУ */}
                <CatalogHeader loading={loading} count={filtered.length} />

                {/* 4. СІТКА ФІЛЬМІВ АБО СТАН ПОРОЖНЕЧІ */}
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