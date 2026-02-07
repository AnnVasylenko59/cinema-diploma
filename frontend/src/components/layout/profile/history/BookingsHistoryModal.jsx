import React, { useState, useEffect } from "react";
import { Ticket, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { BaseModal } from "../../../ui/BaseModal.jsx";
import { EmptyState } from "../../../ui/EmptyState.jsx";
import { LoadingState } from "../../../pages/LoadingState.jsx";

import { BookingItem } from "./BookingItem";

export const BookingsHistoryModal = ({ open, onClose, onGoHome }) => {
    const { t, i18n } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentLocale = i18n.language === 'en' ? 'en-US' : 'uk-UA';

    useEffect(() => {
        const fetchHistory = async () => {
            if (!open) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const res = await axios.get('http://localhost:5000/api/users/my-bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBookings(res.data);
            } catch (_err) {
                console.error("Failed to fetch history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [open]);

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title={t('bookings.title')}
            icon={Ticket}
            iconColorClass="text-blue-500"
            iconBgClass="bg-blue-50 border border-blue-100 shadow-inner"
            maxWidth="max-w-2xl"
        >
            {loading ? (
                <LoadingState label={t('home.updating')} />
            ) : bookings.length > 0 ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-inner-scrollbar">
                    {bookings.map((booking) => (
                        <BookingItem
                            key={booking.id}
                            booking={booking}
                            t={t}
                            locale={currentLocale}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    variant="simple"
                    icon={Ticket}
                    title={t('bookings.empty_title')}
                    description={t('bookings.empty_text')}
                    onAction={onGoHome || onClose}
                    actionLabel={t('profile.buttons.home')}
                />
            )}
        </BaseModal>
    );
};