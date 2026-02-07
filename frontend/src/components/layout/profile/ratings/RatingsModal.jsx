import React from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BaseModal } from "../../../ui/BaseModal.jsx";
import { EmptyState } from "../../../ui/EmptyState.jsx";

export const RatingsModal = ({ open, onClose, onGoHome }) => {
    const { t } = useTranslation();

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title={t('ratings.title')}
            icon={Star}
            iconColorClass="text-yellow-500 fill-yellow-500"
            iconBgClass="bg-yellow-50 border border-yellow-100 shadow-inner"
            maxWidth="max-w-lg"
        >
            <EmptyState
                variant="simple"
                icon={Star}
                title={t('ratings.empty_title')}
                description={t('ratings.empty_text')}
                onAction={onGoHome || onClose}
                actionLabel={t('profile.buttons.home')}
            />
        </BaseModal>
    );
};