import React from "react";
import { Search, Filter, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { styles } from "./FilterStyles";
import { GenreTags } from "./GenreTags";

export const FiltersBar = ({
                               genres = [], selectedGenres, setSelectedGenres,
                               rating, setRating, time, setTime, query, setQuery
                           }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-5 bg-white p-3 rounded-[2.5rem] border border-gray-200 shadow-md">

                {/* 1. Пошук */}
                <div className={`${styles.fieldWrapper} md:col-span-2 group`}>
                    <Search size={20} className="text-blue-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('filters.search_placeholder')}
                        className="w-full bg-transparent outline-none text-sm font-semibold text-gray-700"
                    />
                </div>

                {/* 2. Жанри */}
                <div className={styles.fieldWrapper}>
                    <Filter size={18} className="text-blue-500" />
                    <select
                        value=""
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val && !selectedGenres.includes(val)) setSelectedGenres([...selectedGenres, val]);
                        }}
                        className={styles.select}
                    >
                        <option value="">{t('filters.genres_label')}</option>
                        {genres.map(g => (
                            <option key={g.id} value={g.name}>{t(`filters.genres.${g.name}`, g.name)}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Рейтинг */}
                <div className={styles.fieldWrapper}>
                    <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black uppercase text-blue-500 tracking-tighter">{t('filters.rating_label')}</span>
                            <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-1.5 rounded">{rating.toFixed(1)}</span>
                        </div>
                        <input
                            type="range" min={0} max={10} step={0.1} value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                </div>

                {/* 4. Час */}
                <div className={styles.fieldWrapper}>
                    <Clock size={18} className="text-blue-500" />
                    <select value={time} onChange={(e) => setTime(e.target.value)} className={styles.select}>
                        {['any', 'morning', 'day', 'evening'].map(opt => (
                            <option key={opt} value={opt}>{t(`filters.time_options.${opt}`)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 5. Теги обраних жанрів */}
            <GenreTags
                items={selectedGenres}
                onRemove={(name) => setSelectedGenres(selectedGenres.filter(x => x !== name))}
                onClear={() => setSelectedGenres([])}
            />
        </div>
    );
};