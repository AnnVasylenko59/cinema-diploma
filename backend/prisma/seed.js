const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 *
 */
async function main() {
    console.log('🌱 Початок заповнення бази даних...');

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

    // 2. СТВОРЕННЯ МІСТ (реальні координати)
    console.log('🏙️ Створення міст...');
    const cityData = [
        { lat: 50.4501, lng: 30.5234, uk: 'Київ', en: 'Kyiv' },
        { lat: 49.8397, lng: 24.0297, uk: 'Львів', en: 'Lviv' },
        { lat: 46.4825, lng: 30.7233, uk: 'Одеса', en: 'Odesa' },
        { lat: 48.4647, lng: 35.0462, uk: 'Дніпро', en: 'Dnipro' },
        { lat: 49.9935, lng: 36.2304, uk: 'Харків', en: 'Kharkiv' }
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
            }
        });
        cities.push({ ...city, ukName: c.uk, enName: c.en });
    }

    // 3. СТВОРЕННЯ ЖАНРІВ
    console.log('🎭 Створення жанрів...');
    const genreNames = ['Фантастика', 'Пригоди', 'Драма', 'Комедія', 'Жахи', 'Мультфільм', 'Бойовик', 'Трилер'];
    for (const name of genreNames) {
        await prisma.genre.create({ data: { name } });
    }

    // 4. ВАШІ ОРИГІНАЛЬНІ ФІЛЬМИ (10 штук, нічого не міняю)
    console.log('🎬 Створення фільмів...');
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
                cast: m.cast,
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

    // 5. РЕАЛЬНІ КІНОТЕАТРИ З ПРАВИЛЬНИМИ КООРДИНАТАМИ
    console.log('🏢 Створення кінотеатрів та залів...');

    const realTheaters = [
        // Київ
        { city: 'Київ', name: 'Multiplex', nameEn: 'Multiplex', address: 'ТРЦ Blockbuster, Київ', addressEn: 'Blockbuster Mall, Kyiv', lat: 50.4724, lng: 30.4597, phone: '+380443334455' },
        { city: 'Київ', name: 'Планета Кіно', nameEn: 'Planeta Kino', address: 'ТРЦ Гуллівер, Київ', addressEn: 'Gulliver Mall, Kyiv', lat: 50.4387, lng: 30.5206, phone: '+380442224466' },
        { city: 'Київ', name: 'Кінотеатр Жовтень', nameEn: 'Zhovten Cinema', address: 'вул. Костянтинівська, 26, Київ', addressEn: '26 Kostiantynivska St, Kyiv', lat: 50.4660, lng: 30.5186, phone: '+380442234567' },
        { city: 'Київ', name: 'IMAX', nameEn: 'IMAX', address: 'ТРЦ Ocean Plaza, Київ', addressEn: 'Ocean Plaza Mall, Kyiv', lat: 50.4190, lng: 30.5390, phone: '+380445556677' },

        // Львів
        { city: 'Львів', name: 'Multiplex', nameEn: 'Multiplex', address: 'ТРЦ King Cross Leopolis, Львів', addressEn: 'King Cross Leopolis Mall, Lviv', lat: 49.8236, lng: 24.0312, phone: '+380322334455' },
        { city: 'Львів', name: 'Планета Кіно', nameEn: 'Planeta Kino', address: 'ТРЦ Forum Lviv, Львів', addressEn: 'Forum Lviv Mall, Lviv', lat: 49.8421, lng: 24.0264, phone: '+380322224466' },
        { city: 'Львів', name: 'Кінопалац ім. О. Довженка', nameEn: 'Dovzhenko Cinema Palace', address: 'пр. Свободи, 36, Львів', addressEn: '36 Svobody Ave, Lviv', lat: 49.8398, lng: 24.0290, phone: '+380322345678' },

        // Одеса
        { city: 'Одеса', name: 'Multiplex', nameEn: 'Multiplex', address: 'ТРЦ City Center, Одеса', addressEn: 'City Center Mall, Odesa', lat: 46.4755, lng: 30.7267, phone: '+380482334455' },
        { city: 'Одеса', name: 'Планета Кіно', nameEn: 'Planeta Kino', address: 'ТРЦ Рив`єра, Одеса', addressEn: 'Riviera Mall, Odesa', lat: 46.4168, lng: 30.7701, phone: '+380482224466' },
        { city: 'Одеса', name: 'Кінотеатр Родина', nameEn: 'Rodyna Cinema', address: 'вул. Велика Арнаутська, 82, Одеса', addressEn: '82 Velyka Arnautska St, Odesa', lat: 46.4712, lng: 30.7305, phone: '+380482345678' },

        // Дніпро
        { city: 'Дніпро', name: 'Multiplex', nameEn: 'Multiplex', address: 'ТРЦ Most City, Дніпро', addressEn: 'Most City Mall, Dnipro', lat: 48.4443, lng: 35.0484, phone: '+380562334455' },
        { city: 'Дніпро', name: 'Планета Кіно', nameEn: 'Planeta Kino', address: 'ТРЦ Пасаж, Дніпро', addressEn: 'Pasazh Mall, Dnipro', lat: 48.4600, lng: 35.0527, phone: '+380562224466' },
        { city: 'Дніпро', name: 'Кінозал Правда', nameEn: 'Pravda Cinema', address: 'вул. Воскресенська, 23, Дніпро', addressEn: '23 Voskresenska St, Dnipro', lat: 48.4560, lng: 35.0450, phone: '+380562345678' },

        // Харків
        { city: 'Харків', name: 'Multiplex', nameEn: 'Multiplex', address: 'ТРЦ Karavan, Харків', addressEn: 'Karavan Mall, Kharkiv', lat: 49.9845, lng: 36.2538, phone: '+380572334455' },
        { city: 'Харків', name: 'Планета Кіно', nameEn: 'Planeta Kino', address: 'ТРЦ Французький бульвар, Харків', addressEn: 'French Boulevard Mall, Kharkiv', lat: 50.0230, lng: 36.2530, phone: '+380572224466' },
        { city: 'Харків', name: 'Кінотеатр Боммер', nameEn: 'Bommer Cinema', address: 'вул. Сумська, 23, Харків', addressEn: '23 Sumska St, Kharkiv', lat: 50.0047, lng: 36.2340, phone: '+380572345678' }
    ];

    const allHalls = [];

    for (const theaterData of realTheaters) {
        const city = cities.find(c => c.ukName === theaterData.city);
        if (!city) continue;

        // Створюємо 3-4 зали для кожного кінотеатру
        const hallsCount = 4;
        const hallsData = [];

        for (let h = 0; h < hallsCount; h++) {
            const seatsCount = 80 + (h * 10);
            const vipSeatsCount = Math.floor(seatsCount * 0.1);

            hallsData.push({
                name: `${h === 0 ? 'VIP ' : ''}Зал ${h + 1}`,
                totalSeats: seatsCount,
                seats: {
                    create: Array.from({ length: seatsCount }, (_, idx) => ({
                        rowNum: Math.floor(idx / 12) + 1,
                        seatNum: (idx % 12) + 1,
                        type: idx < vipSeatsCount ? 'vip' : 'standard'
                    }))
                }
            });
        }

        const theater = await prisma.theater.create({
            data: {
                cityId: city.id,
                coords: `${theaterData.lat},${theaterData.lng}`,
                phone: theaterData.phone,
                translations: {
                    create: [
                        { language: 'uk', name: theaterData.name, address: theaterData.address },
                        { language: 'en', name: theaterData.nameEn, address: theaterData.addressEn }
                    ]
                },
                halls: { create: hallsData }
            }
        });

        const theaterWithHalls = await prisma.theater.findUnique({
            where: { id: theater.id },
            include: { halls: true }
        });

        if (theaterWithHalls && theaterWithHalls.halls) {
            allHalls.push(...theaterWithHalls.halls);
        }
    }

    console.log(`✅ Створено кінотеатрів: ${realTheaters.length}, залів: ${allHalls.length}`);

    // 6. КОРИСТУВАЧІ
    console.log('👥 Створення тестових користувачів...');
    await prisma.user.create({
        data: { login: 'admin', name: 'Адміністратор', email: 'admin@test.com', password: 'Admin123', isAdmin: true }
    });
    await prisma.user.create({
        data: { login: 'ann', name: 'Анна', email: 'ann@gmail.com', password: 'Qwerty123', isAdmin: false }
    });

    // 7. СЕАНСИ (багато!)
    console.log('🎟️ Створення сеансів...');

    const timeSlots = [
        { hour: 10, minute: 0, modifier: 0.8 },
        { hour: 12, minute: 30, modifier: 0.9 },
        { hour: 15, minute: 0, modifier: 1.0 },
        { hour: 17, minute: 30, modifier: 1.1 },
        { hour: 20, minute: 0, modifier: 1.2 },
        { hour: 22, minute: 30, modifier: 1.3 }
    ];

    let totalShowtimes = 0;

    // Дати: 13-30 червня 2026
    for (let dayOffset = 13; dayOffset <= 30; dayOffset++) {
        const isWeekend = [13, 14, 20, 21, 27, 28].includes(dayOffset);
        const weekendModifier = isWeekend ? 1.15 : 1.0;

        for (const movie of createdMovies) {
            // Кількість сеансів на день для кожного фільму: 2-4
            const sessionsPerDay = 2 + (movie.id % 3);

            for (let s = 0; s < sessionsPerDay; s++) {
                const slotIndex = (movie.id + s + dayOffset) % timeSlots.length;
                const slot = timeSlots[slotIndex];

                const randomHall = allHalls[Math.floor(Math.random() * allHalls.length)];
                if (!randomHall) continue;

                const basePrice = movie.basePrice;
                const finalPrice = Math.round(basePrice * slot.modifier * weekendModifier / 10) * 10;

                const date = new Date(2026, 5, dayOffset, slot.hour, slot.minute, 0);

                await prisma.showtime.create({
                    data: {
                        startTime: date,
                        price: finalPrice,
                        movieId: movie.id,
                        hallId: randomHall.id
                    }
                });

                totalShowtimes++;
            }
        }
    }

    console.log('\n🚀 ЗВІТ ПРО НАПОВНЕННЯ:');
    console.log('=========================================');
    console.log(`✅ Міст: ${cities.length}`);
    console.log(`✅ Кінотеатрів: ${realTheaters.length}`);
    console.log(`✅ Залів: ${allHalls.length}`);
    console.log(`✅ Фільмів: ${createdMovies.length}`);
    console.log(`✅ Сеансів: ${totalShowtimes}`);
    console.log('📅 Діапазон дат: 13-30 червня 2026');
    console.log('=========================================');
    console.log('🎉 БАЗУ ДАНИХ УСПІШНО НАПОВНЕНО!');
}

main()
    .catch(e => {
        console.error('❌ Помилка:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });