const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Головна функція для наповнення бази даних початковими даними.
 * Виконує повне очищення таблиць та створення міст, жанрів, фільмів, залів та сеансів.
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
    console.log('🌱 Початок заповнення бази даних (стандартна схема)...');

    // 1. ПОВНЕ ОЧИЩЕННЯ
    console.log('🧹 Очищення даних...');
    await prisma.ticket.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.watchlistItem.deleteMany();
    await prisma.showtime.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.hall.deleteMany();
    await prisma.theater.deleteMany();
    await prisma.city.deleteMany();
    await prisma.movieGenre.deleteMany();
    await prisma.movie.deleteMany();
    await prisma.genre.deleteMany();
    await prisma.user.deleteMany();

    // 2. СТВОРЕННЯ МІСТ
    console.log('🏙️ Створення міст...');
    const kyiv = await prisma.city.create({ data: { name: 'Київ', lat: 50.4501, lng: 30.5234 } });
    const lviv = await prisma.city.create({ data: { name: 'Львів', lat: 49.8397, lng: 24.0297 } });
    const odesa = await prisma.city.create({ data: { name: 'Одеса', lat: 46.4825, lng: 30.7233 } });
    const dnipro = await prisma.city.create({ data: { name: 'Дніпро', lat: 48.4647, lng: 35.0462 } });

    const cities = [kyiv, lviv, odesa, dnipro];

    // 3. СТВОРЕННЯ ЖАНРІВ
    console.log('🎭 Створення жанрів...');
    const genreNames = ['Фантастика', 'Пригоди', 'Драма', 'Комедія', 'Жахи', 'Мультфільм', 'Бойовик', 'Трилер'];
    for (const name of genreNames) {
        await prisma.genre.create({ data: { name } });
    }

    // 4. СТВОРЕННЯ ФІЛЬМІВ
    console.log('🎬 Створення списку фільмів...');

    /**
     * @typedef {Object} MovieData
     * @property {string} title
     * @property {number} year
     * @property {number} durationMin
     * @property {number} rating
     * @property {string} director
     * @property {string[]} genres
     * @property {string} posterUrl
     * @property {string} backdropUrl
     * @property {string} trailerUrl
     * @property {string} description
     * @property {number} basePrice
     */

    /** @type {MovieData[]} */
    const moviesList = [
        { title: 'Аватар: Вогонь і попіл', year: 2025, durationMin: 180, rating: 9.0, director: 'Джеймс Кемерон', genres: ['Фантастика', 'Пригоди'],
            posterUrl: 'https://preview.redd.it/avatar-fire-and-ash-fan-poster-v0-ui6arpdp36mf1.jpeg?width=1080&crop=smart&auto=webp&s=ea7f56bb7570733369d7d91d14c1abf319015241',
            backdropUrl: 'https://multiplex.ua/images/4b/29/4b2928874bf2a3da40804e576054c0e3.jpeg',
            trailerUrl: 'https://www.youtube.com/embed/os_CcXsSHPM',
            description: 'Джейк Саллі стикається з племенем людей попелу.',
            basePrice: 200 },
        { title: 'Супермен', year: 2025, durationMin: 155, rating: 8.5, director: 'Джеймс Ганн', genres: ['Бойовик', 'Фантастика'],
            posterUrl: 'https://preview.redd.it/superman-movies-ranked-that-ive-seen-v0-u4l02745aynf1.jpeg?width=1080&crop=smart&auto=webp&s=96c8c3d158794ea480b683ef41efe978ca4bd79c',
            backdropUrl: 'https://kg-portal.ru/img/129010/main.jpg',
            trailerUrl: 'https://www.youtube.com/embed/ALfxbq2RhXw',
            description: 'Початок нової ери DC.',
            basePrice: 180 },
        { title: 'Месники: Судний день', year: 2026, durationMin: 170, rating: 9.2, director: 'Ентоні Руссо', genres: ['Бойовик', 'Фантастика'],
            posterUrl: 'https://preview.redd.it/avengers-doomsday-poster-i-made-v0-arvjbe2exquf1.jpeg?width=1080&crop=smart&auto=webp&s=0c9da9172b3cc83cec4cf8a0b5f80ee8bf0cb48e',
            backdropUrl: 'https://itc.ua/wp-content/uploads/2025/09/mcu-problem-blogroll-1722550002367.webp',
            trailerUrl: 'https://www.youtube.com/embed/-T4aI_k5_3Y',
            description: 'Роберт Дауні-молодший у ролі Доктора Дума.',
            basePrice: 220 },
        { title: 'Бетмен: Частина 2', year: 2026, durationMin: 175, rating: 8.8, director: 'Метт Рівз', genres: ['Драма', 'Трилер'],
            posterUrl: 'https://preview.redd.it/my-the-batman-part-ii-teaser-poster-ft-hush-who-would-you-v0-qa7cv14c3u1e1.jpeg?width=1080&crop=smart&auto=webp&s=e380ddaf285dab38a566a81b2b5975dda8726007',
            backdropUrl: 'https://static0.srcdn.com/wordpress/wp-content/uploads/2023/12/a-split-image-of-pattinson-s-batman-in-the-batman-and-a-fan-poster-for-the-batman-2.jpg',
            trailerUrl: 'https://www.youtube.com/embed/T7_zMl_ZhdQ',
            description: 'Брюс Вейн продовжує детективну боротьбу.',
            basePrice: 190 },
        { title: 'Фантастична четвірка', year: 2025, durationMin: 140, rating: 8.0, director: 'Метт Шекман', genres: ['Фантастика'],
            posterUrl: 'https://cdn.planetakino.ua/562_the-fantastic-four_2025/Media/Posters/vertical/opt_003f377b-687e-4c2d-a830-0ae78f0d7c35.webp',
            backdropUrl: 'https://www.okino.ua/media/var/news/2025/05/27/the-fantastic-four-first-steps-poster-crop-1280-1747421650887.jpeg',
            trailerUrl: 'https://www.youtube.com/embed/0bI-Nd-QSm8',
            description: 'Поява Срібного Серфера та Галактуса.',
            basePrice: 170 },
        { title: 'Шрек 5', year: 2026, durationMin: 95, rating: 8.5, director: 'Уолт Дорн', genres: ['Мультфільм', 'Комедія'],
            posterUrl: 'https://upload.wikimedia.org/wikipedia/ru/thumb/4/48/Shrek_5_poster.jpg/330px-Shrek_5_poster.jpg',
            backdropUrl: 'https://www.acmodasi.com.ua/amdb/images/movie/8/1/shrek-5-2026-S13ukI.jpg',
            trailerUrl: 'https://www.youtube.com/embed/0rhcEXJ14Rg',
            description: 'Він повернувся!',
            basePrice: 140 },
        { title: '28 років по тому', year: 2025, durationMin: 115, rating: 7.9, director: 'Денні Бойл', genres: ['Жахи', 'Трилер'],
            posterUrl: 'https://cdn.planetakino.ua/10187_28-years-later_2025/Media/Posters/vertical/opt_fc8ce5ad-f3c6-433f-86b6-7fa4515ec819.webp',
            backdropUrl: 'https://cdn.planetakino.ua/10187_28-years-later_2025/Media/Covers/horizontal/opt_f8681fb4-7b41-4823-9c94-46b79e55dfa9.webp',
            trailerUrl: 'https://www.youtube.com/embed/e67K9lCl8qY',
            description: 'Вірус повертається через три десятиліття.',
            basePrice: 160 },
        { title: 'Трон: Арес', year: 2025, durationMin: 135, rating: 7.6, director: 'Йоахім Реннінг', genres: ['Фантастика'],
            posterUrl: 'https://upload.wikimedia.org/wikipedia/uk/thumb/f/f3/%D0%A2%D1%80%D0%BE%D0%BD_%D0%90%D1%80%D0%B5%D1%81_2025.png/250px-%D0%A2%D1%80%D0%BE%D0%BD_%D0%90%D1%80%D0%B5%D1%81_2025.png',
            backdropUrl: 'https://media.themoviedb.org/t/p/w780/min9ZUDZbiguTiQ7yz1Hbqk78HT.jpg',
            trailerUrl: 'https://www.youtube.com/embed/fHbAkUF2ssw',
            description: 'Програма переходить у фізичний світ.',
            basePrice: 175 },
        { title: 'Місія нездійсненна 8', year: 2025, durationMin: 165, rating: 8.2, director: 'Крістофер Маккворрі', genres: ['Бойовик', 'Пригоди'],
            posterUrl: 'https://cdn.planetakino.ua/9069_mission-impossible-the-final-reckoning_2024/Media/Posters/vertical/opt_f6b487e0-45f2-45fe-8d57-078e142c61a7.webp',
            backdropUrl: 'https://itc.ua/wp-content/uploads/2024/10/03xzkttukb-scaled.webp',
            trailerUrl: 'https://www.youtube.com/embed/qLvLGlFFkWg',
            description: 'Фінал боротьби з Сутністю.',
            basePrice: 190 },
        { title: 'Дюна: Частина друга', year: 2024, durationMin: 166, rating: 8.9, director: 'Дені Вільньов', genres: ['Фантастика', 'Драма'],
            posterUrl: 'https://www.palladium-cinema.com.ua/storage/upload/film/dyuna-chastina-druga-dune-part-two/e460aa944b63705d3e2ebce8b9b3b8c7eb1330aa.jpg',
            backdropUrl: 'https://static.sweet.tv/images/cache/v3/movie_banner/CN_UARICZW4YAQ==/new-254335-dune-part-two_1280x720.jpg',
            trailerUrl: 'https://www.youtube.com/embed/DtR76pz517E',
            description: 'Епічне завершення саги про Арракіс.',
            basePrice: 210 }
    ];

    /** @type {Array<{id: number, basePrice: number}>} */
    const createdMovies = [];
    for (const m of moviesList) {
        const movie = await prisma.movie.create({
            data: {
                title: m.title,
                year: m.year,
                durationMin: m.durationMin,
                posterUrl: m.posterUrl,
                backdropUrl: m.backdropUrl,
                trailerUrl: m.trailerUrl,
                description: m.description,
                rating: m.rating,
                director: m.director,
                genres: {
                    create: m.genres.map(name => ({
                        genre: { connect: { name } }
                    }))
                }
            }
        });
        createdMovies.push({ id: movie.id, basePrice: m.basePrice });
    }

    // 5. КІНОТЕАТРИ ТА ЗАЛИ
    console.log('🏢 Створення кінотеатрів...');

    /** @type {Array<{id: number, name: string}>} */
    const allHalls = [];

    /** @type {Record<string, Array<{id: number, name: string}>>} */
    const cityHalls = {};

    for (const city of cities) {
        const hallsCount = 2; // По 2 зали в кожному місті
        // Array<{name: string, totalSeats: number, seats: {create: Array<{rowNum: number, seatNum: number, type: string}>}>
        const hallsData = [];

        for (let h = 0; h < hallsCount; h++) {
            const hallName = city.name === 'Дніпро' && h === 0
                ? 'Самарська долина'
                : `Зал ${h + 1}`;

            hallsData.push({
                name: hallName,
                totalSeats: 80,
                seats: {
                    create: Array.from({ length: 80 }, (_, i) => ({
                        rowNum: Math.floor(i / 10) + 1,
                        seatNum: (i % 10) + 1,
                        type: i < 20 ? 'vip' : 'standard'
                    }))
                }
            });
        }

        const theater = await prisma.theater.create({
            data: {
                name: `Cinema City ${city.name}`,
                cityId: city.id,
                address: city.name === 'Дніпро' ? 'вул. Самарська, 12' : 'Центральна площа, 1',
                coords: `${city.lat},${city.lng}`,
                halls: { create: hallsData }
            },
            include: { halls: true }
        });

        cityHalls[city.name] = theater.halls;
        allHalls.push(...theater.halls);
    }

    // 6. КОРИСТУВАЧІ
    console.log('👥 Створення користувачів...');
    await prisma.user.create({
        data: { login: 'admin', name: 'Адміністратор', email: 'admin@test.com', password: 'Admin123', isAdmin: true }
    });
    await prisma.user.create({
        data: { login: 'ann', name: 'Анна', email: 'ann@gmail.com', password: 'Qwerty123', isAdmin: false }
    });

    // 7. СЕАНСИ ДЛЯ ВСІХ ФІЛЬМІВ З 1 ЧЕРВНЯ
    console.log('🎟️ Створення сеансів для всіх фільмів з 1 червня...');

    /**
     * @typedef {Object} TimeSlot
     * @property {number} hour
     * @property {number} minute
     * @property {'ранковий' | 'денний' | 'післяобідній' | 'вечірній' | 'пізній'} label
     */

    /** @type {TimeSlot[]} */
    const timeSlots = [
        { hour: 10, minute: 0, label: 'ранковий' },
        { hour: 12, minute: 30, label: 'денний' },
        { hour: 15, minute: 0, label: 'післяобідній' },
        { hour: 17, minute: 30, label: 'вечірній' },
        { hour: 20, minute: 0, label: 'пізній' }
    ];

    /** @type {Record<'ранковий' | 'денний' | 'післяобідній' | 'вечірній' | 'пізній', number>} */
    const priceModifiers = {
        'ранковий': 0.8,   // -20%
        'денний': 0.9,     // -10%
        'післяобідній': 1.0, // базова ціна
        'вечірній': 1.1,   // +10%
        'пізній': 1.2      // +20%
    };

    const cityNames = ['Київ', 'Львів', 'Одеса', 'Дніпро'];
    let totalShowtimes = 0;

    // Для кожного фільму створюємо сеанси на 10 днів
    for (let day = 1; day <= 10; day++) {
        for (let movieIndex = 0; movieIndex < createdMovies.length; movieIndex++) {
            const movie = createdMovies[movieIndex];

            // Перевірка, що movie існує
            if (!movie) continue;

            // Кожен фільм отримує 2-3 сеанси на день у різних містах
            const sessionsPerDay = 2 + (movieIndex % 2); // 2 або 3 сеанси

            for (let s = 0; s < sessionsPerDay; s++) {
                // Вибираємо часовий слот
                const slotIndex = (movieIndex + s + day) % timeSlots.length;
                const slot = timeSlots[slotIndex];

                // Перевірка, що slot існує
                if (!slot) continue;

                // Вибираємо місто (рівномірний розподіл)
                const cityIndex = (movieIndex + day + s) % cityNames.length;
                const cityName = cityNames[cityIndex];

                // Перевірка, що місто існує в cityHalls
                if (!cityName || !cityHalls[cityName]) continue;

                const cityHallList = cityHalls[cityName];

                // Перевірка, що список залів не порожній
                if (!cityHallList || cityHallList.length === 0) continue;

                // Вибираємо зал
                const hall = cityHallList[s % cityHallList.length];

                // Перевірка, що зал існує
                if (!hall) continue;

                // Розраховуємо ціну
                const basePrice = movie.basePrice;
                const modifier = priceModifiers[slot.label];
                const weekendModifier = (day === 6 || day === 7) ? 1.15 : 1.0;
                const price = Math.round(basePrice * modifier * weekendModifier / 10) * 10; // Округлення до 10

                // Створюємо дату (5 = червень у JavaScript)
                const date = new Date(2026, 5, day, slot.hour, slot.minute, 0);

                await prisma.showtime.create({
                    data: {
                        startTime: date,
                        price: price,
                        movieId: movie.id,
                        hallId: hall.id
                    }
                });

                totalShowtimes++;
            }
        }
    }

    console.log(`✅ Створено ${totalShowtimes} сеансів для 10 фільмів`);
    console.log('📅 Дати: 1-10 червня 2026 року');
    console.log('🏙️ Міста: Київ, Львів, Одеса, Дніпро');
    console.log('💰 Ціни: від 110 до 270 грн залежно від фільму, часу та дня тижня');
    console.log('🎉 БАЗУ ДАНИХ УСПІШНО ЗАПОВНЕНО!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());