import React, { useState, useEffect } from "react";
import { Heart, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { watchlistAPI } from "../../../../services/api";

import { BaseModal } from "../../../ui/BaseModal.jsx";
import { EmptyState } from "../../../ui/EmptyState.jsx";
import { LoadingState } from "../../../pages/LoadingState.jsx";
import { ModalButton } from "../../../ui/ModalButton.jsx";

import { FavoriteItem } from "./FavoriteItem";

export const FavoritesModal = ({ open, onClose, onToggleWatchlist, onOpenMovie, onGoHome }) => {
    const { t } = useTranslation();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) fetchFavorites();
    }, [open]);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const res = await watchlistAPI.get();
            setMovies(res.data);
        } catch (err) { console.error("Error loading favorites:", err); }
        finally { setLoading(false); }
    };

    const handleRemove = async (movieId) => {
        await onToggleWatchlist(movieId);
        setMovies(prev => prev.filter(m => m.id !== movieId));
    };

    const Footer = movies.length > 0 && (
        <ModalButton onClick={onGoHome} icon={ChevronLeft} variant="outline" className="w-full">
            {t('favorites.back_to_afisha')}
        </ModalButton>
    );

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title={t('favorites.title')}
            icon={Heart}
            iconColorClass="text-pink-500 fill-pink-500"
            iconBgClass="bg-pink-50 border border-pink-100 shadow-inner"
            maxWidth="max-w-lg"
            footer={Footer}
        >
            {loading ? (
                <LoadingState label={t('favorites.loading')} />
            ) : movies.length > 0 ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-inner-scrollbar">
                    {movies.map((movie) => (
                        <FavoriteItem
                            key={movie.id}
                            movie={movie}
                            onOpen={onOpenMovie}
                            onRemove={handleRemove}
                            t={t}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    variant="simple"
                    icon={Heart}
                    title={t('favorites.empty_title')}
                    description={t('favorites.empty_text')}
                    onAction={onGoHome || onClose}
                    actionLabel={t('profile.buttons.home')}
                />
            )}
        </BaseModal>
    );
};