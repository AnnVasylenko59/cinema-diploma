const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Головна функція для наповнення бази даних початковими даними згідно з 3NF.
 * Переносить сеанси на період після 12 червня 2026 року та додає повну локалізацію (UK/EN) і каст.
 * @async
 * @function main
 */
async function main() {
    console.log('🌱 Початок заповнення бази даних (Локалізована 3NF схема)...');

    // 1. ПОВНЕ КАСКАДНЕ ОЧИЩЕННЯ
    console.log('🧹 Очищення застарілих даних...');
    await prisma.ticket.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.watchlistItem.deleteMany();
    await prisma.showtime.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.hall.deleteMany();
    await prisma.theaterTranslation.deleteMany();
    await prisma.theater.deleteMany();
    await prisma.cityTranslation.deleteMany();
    await prisma.city.deleteMany();
    await prisma.movieGenre.deleteMany();
    await prisma.movieTranslation.deleteMany();
    await prisma.movie.deleteMany();
    await prisma.genre.deleteMany();
    await prisma.user.deleteMany();

    // 2. СТВОРЕННЯ МІСТ ТА ЇХ ПЕРЕКЛАДІВ
    console.log('🏙️ Створення міст та 3NF локалізацій...');
    const cityData = [
        { lat: 50.4501, lng: 30.5234, uk: 'Київ', en: 'Kyiv' },
        { lat: 49.8397, lng: 24.0297, uk: 'Львів', en: 'Lviv' },
        { lat: 46.4825, lng: 30.7233, uk: 'Одеса', en: 'Odesa' },
        { lat: 48.4647, lng: 35.0462, uk: 'Дніпро', en: 'Dnipro' }
    ];

    const cities = [];
    for (const c of cityData) {
        const city = await prisma.city.create({
            data: {
                lat: c.lat,
                lng: c.lng,
                translations: {
                    create: [
                        { language: 'uk', name: c.uk },
                        { language: 'en', name: c.en }
                    ]
                }
            },
            include: { translations: true }
        });
        cities.push(city);
    }

    // 3. СТВОРЕННЯ ЖАНРІВ
    console.log('🎭 Створення жанрів...');
    const genreNames = ['Фантастика', 'Пригоди', 'Драма', 'Комедія', 'Жахи', 'Мультфільм', 'Бойовик', 'Трилер'];
    for (const name of genreNames) {
        await prisma.genre.create({ data: { name } });
    }

    // 4. СТВОРЕННЯ ФІЛЬМІВ ТА ЇХ ПЕРЕКЛАДІВ (3NF) + CAST
    console.log('🎬 Створення списку фільмів, касту та двомовних сюжетів...');
    const moviesList = [
        {
            year: 2025, durationMin: 180, rating: 9.0, director: 'James Cameron', basePrice: 200,
            genres: ['Фантастика', 'Пригоди'],
            cast: ['Sam Worthington', 'Zoe Saldaña', 'Sigourney Weaver', 'Stephen Lang'],
            posterUrl: 'https://preview.redd.it/avatar-fire-and-ash-fan-poster-v0-ui6arpdp36mf1.jpeg?width=1080&crop=smart&auto=webp&s=ea7f56bb7570733369d7d91d14c1abf319015241',
            backdropUrl: 'https://multiplex.ua/images/4b/29/4b2928874bf2a3da40804e576054c0e3.jpeg',
            trailerUrl: 'https://www.youtube.com/embed/os_CcXsSHPM',
            uk: { title: 'Аватар: Вогонь і попіл', description: 'Джейк Саллі стикається з войовничим племенем людей попелу.' },
            en: { title: 'Avatar: Fire and Ash', description: 'Jake Sully confronts a fierce and aggressive tribe of fire people.' }
        },
        {
            year: 2025, durationMin: 155, rating: 8.5, director: 'James Gunn', basePrice: 180,
            genres: ['Бойовик', 'Фантастика'],
            cast: ['David Corenswet', 'Rachel Brosnahan', 'Nicholas Hoult', 'Isabela Merced'],
            posterUrl: 'https://preview.redd.it/superman-movies-ranked-that-ive-seen-v0-u4l02745aynf1.jpeg?width=1080&crop=smart&auto=webp&s=96c8c3d158794ea480b683ef41efe978ca4bd79c',
            backdropUrl: 'https://kg-portal.ru/img/129010/main.jpg',
            trailerUrl: 'https://www.youtube.com/embed/ALfxbq2RhXw',
            uk: { title: 'Супермен', description: 'Початок нової ери всесвіту DC та становлення Кларка Кента.' },
            en: { title: 'Superman', description: 'The beginning of a new DC Universe era and the journey of Clark Kent.' }
        },
        {
            year: 2026, durationMin: 170, rating: 9.2, director: 'Anthony Russo', basePrice: 220,
            genres: ['Бойовик', 'Фантастика'],
            cast: ['Robert Downey Jr.', 'Pedro Pascal', 'Vanessa Kirby', 'Benedict Cumberbatch'],
            posterUrl: 'https://preview.redd.it/avengers-doomsday-poster-i-made-v0-arvjbe2exquf1.jpeg?width=1080&crop=smart&auto=webp&s=0c9da9172b3cc83cec4cf8a0b5f80ee8bf0cb48e',
            backdropUrl: 'https://itc.ua/wp-content/uploads/2025/09/mcu-problem-blogroll-1722550002367.webp',
            trailerUrl: 'https://www.youtube.com/embed/-T4aI_k5_3Y',
            uk: { title: 'Месники: Судний день', description: 'Найвеличніші герої Землі стикаються з Робертом Дауні-молодшим у ролі Доктора Дума.' },
            en: { title: 'Avengers: Doomsday', description: 'Earth\'s mightiest heroes face Robert Downey Jr. as the sinister Doctor Doom.' }
        },
        {
            year: 2026, durationMin: 175, rating: 8.8, director: 'Matt Reeves', basePrice: 190,
            genres: ['Драма', 'Трилер'],
            cast: ['Robert Pattinson', 'Zoë Kravitz', 'Colin Farrell', 'Andy Serkis'],
            posterUrl: 'https://preview.redd.it/my-the-batman-part-ii-teaser-poster-ft-hush-who-would-you-v0-qa7cv14c3u1e1.jpeg?width=1080&crop=smart&auto=webp&s=e380ddaf285dab38a566a81b2b5975dda8726007',
            backdropUrl: 'https://static0.srcdn.com/wordpress/wp-content/uploads/2023/12/a-split-image-of-pattinson-s-batman-in-the-batman-and-a-fan-poster-for-the-batman-2.jpg',
            trailerUrl: 'https://www.youtube.com/embed/T7_zMl_ZhdQ',
            uk: { title: 'Бетмен: Частина 2', description: 'Брюс Вейн занурюється ще глибше у похмурий детективний світ Готема.' },
            en: { title: 'The Batman: Part II', description: 'Bruce Wayne delves even deeper into the dark detective underbelly of Gotham City.' }
        },
        {
            year: 2025, durationMin: 140, rating: 8.0, director: 'Matt Shakman', basePrice: 170,
            genres: ['Фантастика'],
            cast: ['Pedro Pascal', 'Vanessa Kirby', 'Joseph Quinn', 'Ebon Moss-Bachrach'],
            posterUrl: 'https://cdn.planetakino.ua/562_the-fantastic-four_2025/Media/Posters/vertical/opt_003f377b-687e-4c2d-a830-0ae78f0d7c35.webp',
            backdropUrl: 'https://www.okino.ua/media/var/news/2025/05/27/the-fantastic-four-first-steps-poster-crop-1280-1747421650887.jpeg',
            trailerUrl: 'https://www.youtube.com/embed/0bI-Nd-QSm8',
            uk: { title: 'Фантастична четвірка: Перші кроки', description: 'Перша сім’я Marvel стикається із загрозою Срібного Серфера та Галактуса.' },
            en: { title: 'The Fantastic Four: First Steps', description: 'Marvel\'s First Family faces the cosmic threat of the Silver Surfer and Galactus.' }
        },
        {
            year: 2026, durationMin: 95, rating: 8.5, director: 'Walt Dohrn', basePrice: 140,
            genres: ['Мультфільм', 'Комедія'],
            cast: ['Mike Myers', 'Eddie Murphy', 'Cameron Diaz', 'Antonio Banderas'],
            posterUrl: 'https://upload.wikimedia.org/wikipedia/ru/thumb/4/48/Shrek_5_poster.jpg/330px-Shrek_5_poster.jpg',
            backdropUrl: 'https://www.acmodasi.com.ua/amdb/images/movie/8/1/shrek-5-2026-S13ukI.jpg',
            trailerUrl: 'https://www.youtube.com/embed/0rhcEXJ14Rg',
            uk: { title: 'Шрек 5', description: 'Зелений велетень та Осел повертаються у новій божевільній пригоді.' },
            en: { title: 'Shrek 5', description: 'The legendary green ogre and Donkey return for a brand new hilarious journey.' }
        },
        {
            year: 2025, durationMin: 115, rating: 7.9, director: 'Danny Boyle', basePrice: 160,
            genres: ['Жахи', 'Трилер'],
            cast: ['Cillian Murphy', 'Aaron Taylor-Johnson', 'Jodie Comer', 'Ralph Fiennes'],
            posterUrl: 'https://cdn.planetakino.ua/10187_28-years-later_2025/Media/Posters/vertical/opt_fc8ce5ad-f3c6-433f-86b6-7fa4515ec819.webp',
            backdropUrl: 'https://cdn.planetakino.ua/10187_28-years-later_2025/Media/Covers/horizontal/opt_f8681fb4-7b41-4823-9c94-46b79e55dfa9.webp',
            trailerUrl: 'https://www.youtube.com/embed/e67K9lCl8qY',
            uk: { title: '28 років по тому', description: 'Культовий вірус люті повертається через три десятиліття.' },
            en: { title: '28 Years Later', description: 'The legendary rage virus returns to devastate the world after three decades.' }
        },
        {
            year: 2025, durationMin: 135, rating: 7.6, director: 'Joachim Rønning', basePrice: 175,
            genres: ['Фантастика'],
            cast: ['Jared Leto', 'Greta Lee', 'Evan Peters', 'Jeff Bridges'],
            posterUrl: 'https://upload.wikimedia.org/wikipedia/uk/thumb/f/f3/%D0%A2%D1%80%D0%BE%D0%BD_%D0%90%D1%80%D0%B5%D1%81_2025.png/250px-%D0%A2%D1%80%D0%BE%D0%BD_%D0%90%D1%80%D0%B5%D1%81_2025.png',
            backdropUrl: 'https://media.themoviedb.org/t/p/w780/min9ZUDZbiguTiQ7yz1Hbqk78HT.jpg',
            trailerUrl: 'https://www.youtube.com/embed/fHbAkUF2ssw',
            uk: { title: 'Трон: Арес', description: 'Високотехнологічна комп’ютерна програма Арес проривається у фізичний світ.' },
            en: { title: 'TRON: Ares', description: 'A highly sophisticated digital program, Ares, crosses over into the physical world.' }
        },
        {
            year: 2025, durationMin: 165, rating: 8.2, director: 'Christopher McQuarrie', basePrice: 190,
            genres: ['Бойовик', 'Пригоди'],
            cast: ['Tom Cruise', 'Hayley Atwell', 'Ving Rhames', 'Simon Pegg'],
            posterUrl: 'https://cdn.planetakino.ua/9069_mission-impossible-the-final-reckoning_2024/Media/Posters/vertical/opt_f6b487e0-45f2-45fe-8d57-078e142c61a7.webp',
            backdropUrl: 'https://itc.ua/wp-content/uploads/2024/10/03xzkttukb-scaled.webp',
            trailerUrl: 'https://www.youtube.com/embed/qLvLGlFFkWg',
            uk: { title: 'Місія нездійсненна: Фінальна розплата', description: 'Ітан Гант виходить на фінальну та найнебезпечнішу битву з ШІ Сутність.' },
            en: { title: 'Mission: Impossible - The Final Reckoning', description: 'Ethan Hunt enters the ultimate, dangerous final battle against the rogue Entity AI.' }
        },
        {
            year: 2024, durationMin: 166, rating: 8.9, director: 'Denis Villeneuve', basePrice: 210,
            genres: ['Фантастика', 'Драма'],
            cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
            posterUrl: 'https://www.palladium-cinema.com.ua/storage/upload/film/dyuna-chastina-druga-dune-part-two/e460aa944b63705d3e2ebce8b9b3b8c7eb1330aa.jpg',
            backdropUrl: 'https://static.sweet.tv/images/cache/v3/movie_banner/CN_UARICZW4YAQ==/new-254335-dune-part-two_1280x720.jpg',
            trailerUrl: 'https://www.youtube.com/embed/DtR76pz517E',
            uk: { title: 'Дюна: Частина друга', description: 'Пол Атрід Разом із фріменами виходить на стежку війни проти загарбників.' },
            en: { title: 'Dune: Part Two', description: 'Paul Atreides unites with Chani and the Fremen to seek revenge against the conspirators.' }
        }
    ];

    const createdMovies = [];
    for (const m of moviesList) {
        const movie = await prisma.movie.create({
            data: {
                year: m.year,
                durationMin: m.durationMin,
                posterUrl: m.posterUrl,
                backdropUrl: m.backdropUrl,
                trailerUrl: m.trailerUrl,
                rating: m.rating,
                director: m.director,
                cast: m.cast, // <--- Ось тут масив акторів зберігається у БД
                translations: {
                    create: [
                        { language: 'uk', title: m.uk.title, description: m.uk.description },
                        { language: 'en', title: m.en.title, description: m.en.description }
                    ]
                },
                genres: {
                    create: m.genres.map(name => ({
                        genre: { connect: { name } }
                    }))
                }
            }
        });
        createdMovies.push({ id: movie.id, basePrice: m.basePrice });
    }

    // 5. КІНОТЕАТРИ, ЗАЛИ ТА ЇХ ПЕРЕКЛАДІВ (3NF)
    console.log('🏢 Створення кінотеатрів, залів та схем крісел...');
    const cityHalls = {};

    for (const city of cities) {
        // Отримуємо укр назву міста для генерації назв залів
        const ukCityName = city.translations.find(t => t.language === 'uk').name;

        const hallsData = [];
        for (let h = 0; h < 2; h++) {
            const hallName = (ukCityName === 'Дніпро' && h === 0) ? 'Самарська долина' : `Зал ${h + 1}`;
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

        // Обробка адрес для міст
        let ukAddress = 'Центральна площа, 1';
        let enAddress = '1 Central Square';
        if (ukCityName === 'Дніпро') {
            ukAddress = 'вул. Самарська, 12';
            enAddress = '12 Samarska Str.';
        }

        const theater = await prisma.theater.create({
            data: {
                cityId: city.id,
                coords: `${city.lat},${city.lng}`,
                phone: '+380501234567',
                translations: {
                    create: [
                        { language: 'uk', name: `Сінема Сіті ${ukCityName}`, address: ukAddress },
                        { language: 'en', name: `Cinema City ${city.translations.find(t => t.language === 'en').name}`, address: `${enAddress}, ${city.translations.find(t => t.language === 'en').name}` }
                    ]
                },
                halls: { create: hallsData }
            },
            include: { halls: true }
        });

        cityHalls[ukCityName] = theater.halls;
    }

    // 6. КОРИСТУВАЧІ
    console.log('👥 Створення тестових користувачів...');
    await prisma.user.create({
        data: { login: 'admin', name: 'Адміністратор', email: 'admin@test.com', password: 'Admin123', isAdmin: true }
    });
    await prisma.user.create({
        data: { login: 'ann', name: 'Анна', email: 'ann@gmail.com', password: 'Qwerty123', isAdmin: false }
    });

    // 7. СЕАНСИ ДЛЯ ВСІХ ФІЛЬМІВ ПІСЛЯ 12 ЧЕРВНЯ (13 - 22 ЧЕРВНЯ 2026 РОКУ)
    console.log('🎟️ Створення сеансів на дати після 12 червня 2026 року...');

    const timeSlots = [
        { hour: 10, minute: 0, label: 'ранковий' },
        { hour: 12, minute: 30, label: 'денний' },
        { hour: 15, minute: 0, label: 'післяобідній' },
        { hour: 17, minute: 30, label: 'вечірній' },
        { hour: 20, minute: 0, label: 'пізній' }
    ];

    const priceModifiers = {
        'ранковий': 0.8, 'денний': 0.9, 'післяобідній': 1.0, 'вечірній': 1.1, 'пізній': 1.2
    };

    const cityNames = ['Київ', 'Львів', 'Одеса', 'Дніпро'];
    let totalShowtimes = 0;

    for (let dayOffset = 13; dayOffset <= 22; dayOffset++) {
        for (let movieIndex = 0; movieIndex < createdMovies.length; movieIndex++) {
            const movie = createdMovies[movieIndex];
            if (!movie) continue;

            const sessionsPerDay = 2 + (movieIndex % 2);

            for (let s = 0; s < sessionsPerDay; s++) {
                const slotIndex = (movieIndex + s + dayOffset) % timeSlots.length;
                const slot = timeSlots[slotIndex];
                if (!slot) continue;

                const cityIndex = (movieIndex + dayOffset + s) % cityNames.length;
                const cityName = cityNames[cityIndex];
                if (!cityName || !cityHalls[cityName]) continue;

                const cityHallList = cityHalls[cityName];
                if (!cityHallList || cityHallList.length === 0) continue;

                const hall = cityHallList[s % cityHallList.length];
                if (!hall) continue;

                const basePrice = movie.basePrice;
                const modifier = priceModifiers[slot.label];

                // Перевірка на вихідні (13, 14 червня та 20, 21 червня — це Сб/Нд у 2026 році)
                const isWeekend = (dayOffset === 13 || dayOffset === 14 || dayOffset === 20 || dayOffset === 21);
                const weekendModifier = isWeekend ? 1.15 : 1.0;

                const price = Math.round(basePrice * modifier * weekendModifier / 10) * 10;

                // Створюємо дату (5 = червень у JS Date Object)
                const date = new Date(2026, 5, dayOffset, slot.hour, slot.minute, 0);

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

    console.log('\n🚀 Звіт виконання сид-скрипту:');
    console.log('=========================================');
    console.log(`✅ Успішно згенеровано ${totalShowtimes} сеансів.`);
    console.log('📅 Новий діапазон дат: 13–22 червня 2026 року (Суворо після 12 червня).');
    console.log('🏙️ Локалізація міст та кінотеатрів: 3NF Таблиці заповнено (UK та EN).');
    console.log('🎬 Афіша: Сюжети та назви 10 блокбастерів повністю перекладено.');
    console.log('=========================================\n🎉 БАЗУ ДАНИХ УСПІШНО ОНОВЛЕНО!');
}

main()
    .catch(e => {
        console.error('❌ Помилка заповнення бази даних:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });