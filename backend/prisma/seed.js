const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Початок заповнення бази даних (стандартна схема)...');

    // 1. ПОВНЕ ОЧИЩЕННЯ
    console.log('🧹 Очищення даних...');
    const tables = [
        prisma.ticket, prisma.booking, prisma.watchlistItem, prisma.showtime,
        prisma.seat, prisma.hall, prisma.theater, prisma.city,
        prisma.movieGenre, prisma.movie, prisma.genre, prisma.user, prisma.person
    ];
    for (const table of tables) { await table.deleteMany(); }

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
    const moviesList = [
        { title: 'Аватар: Вогонь і попіл', year: 2025, durationMin: 180, rating: 9.0, director: 'Джеймс Кемерон', genres: ['Фантастика', 'Пригоди'],
            posterUrl: 'https://preview.redd.it/avatar-fire-and-ash-fan-poster-v0-ui6arpdp36mf1.jpeg?width=1080&crop=smart&auto=webp&s=ea7f56bb7570733369d7d91d14c1abf319015241',
            backdropUrl: 'https://multiplex.ua/images/4b/29/4b2928874bf2a3da40804e576054c0e3.jpeg',
            trailerUrl: 'https://www.youtube.com/watch?v=os_CcXsSHPM',
            description: 'Джейк Саллі стикається з племенем людей попелу.' },
        { title: 'Супермен', year: 2025, durationMin: 155, rating: 8.5, director: 'Джеймс Ганн', genres: ['Бойовик', 'Фантастика'],
            posterUrl: 'https://preview.redd.it/superman-movies-ranked-that-ive-seen-v0-u4l02745aynf1.jpeg?width=1080&crop=smart&auto=webp&s=96c8c3d158794ea480b683ef41efe978ca4bd79c',
            backdropUrl: 'https://kg-portal.ru/img/129010/main.jpg',
            trailerUrl: 'https://www.youtube.com/watch?v=ALfxbq2RhXw&pp=ygUf0YHRg9C_0LXRgNC80LXQvSDRgtGA0LXQudC70LXRgA%3D%3D',
            description: 'Початок нової ери DC.' },
        { title: 'Месники: Судний день', year: 2026, durationMin: 170, rating: 9.2, director: 'Ентоні Руссо', genres: ['Бойовик', 'Фантастика'],
            posterUrl: 'https://preview.redd.it/avengers-doomsday-poster-i-made-v0-arvjbe2exquf1.jpeg?width=1080&crop=smart&auto=webp&s=0c9da9172b3cc83cec4cf8a0b5f80ee8bf0cb48e',
            backdropUrl: 'https://itc.ua/wp-content/uploads/2025/09/mcu-problem-blogroll-1722550002367.webp',
            trailerUrl: 'https://www.youtube.com/watch?v=-T4aI_k5_3Y&pp=ygU00LzQtdGB0L3QuNC60Lgg0YHRg9C80LTQvdC40Lkg0LTQtdC90YzRgtGA0LXQudC70LXRgA%3D%3D',
            description: 'Роберт Дауні-молодший у ролі Доктора Дума.' },
        { title: 'Бетмен: Частина 2', year: 2026, durationMin: 175, rating: 8.8, director: 'Метт Рівз', genres: ['Драма', 'Трилер'],
            posterUrl: 'https://preview.redd.it/my-the-batman-part-ii-teaser-poster-ft-hush-who-would-you-v0-qa7cv14c3u1e1.jpeg?width=1080&crop=smart&auto=webp&s=e380ddaf285dab38a566a81b2b5975dda8726007',
            backdropUrl: 'https://static0.srcdn.com/wordpress/wp-content/uploads/2023/12/a-split-image-of-pattinson-s-batman-in-the-batman-and-a-fan-poster-for-the-batman-2.jpg',
            trailerUrl: 'https://www.youtube.com/watch?v=T7_zMl_ZhdQ&pp=ygUd0LHQtdGC0LzQtdC9IDIg0YLRgNC10LnQu9C10YA%3D',
            description: 'Брюс Вейн продовжує детективну боротьбу.' },
        { title: 'Фантастична четвірка', year: 2025, durationMin: 140, rating: 8.0, director: 'Метт Шекман', genres: ['Фантастика'],
            posterUrl: 'https://cdn.planetakino.ua/562_the-fantastic-four_2025/Media/Posters/vertical/opt_003f377b-687e-4c2d-a830-0ae78f0d7c35.webp',
            backdropUrl: 'https://www.okino.ua/media/var/news/2025/05/27/the-fantastic-four-first-steps-poster-crop-1280-1747421650887.jpeg',
            trailerUrl: 'https://www.youtube.com/watch?v=0bI-Nd-QSm8&pp=ygU20YTQsNC90YLQsNGB0YLQuNGH0L3QsCDRh9C10YLQstGW0YDQutCwINGC0YDQtdC50LvQtdGA',
            description: 'Поява Срібного Серфера та Галактуса.' },
        { title: 'Шрек 5', year: 2026, durationMin: 95, rating: 8.5, director: 'Уолт Дорн', genres: ['Мультфільм', 'Комедія'],
            posterUrl: 'https://upload.wikimedia.org/wikipedia/ru/thumb/4/48/Shrek_5_poster.jpg/330px-Shrek_5_poster.jpg',
            backdropUrl: 'https://www.acmodasi.com.ua/amdb/images/movie/8/1/shrek-5-2026-S13ukI.jpg',
            trailerUrl: 'https://www.youtube.com/watch?v=0rhcEXJ14Rg&pp=ygUZ0YjRgNC10LogNSDRgtGA0LXQudC70LXRgA%3D%3D',
            description: 'Він повернувся!' },
        { title: '28 років по тому', year: 2025, durationMin: 115, rating: 7.9, director: 'Денні Бойл', genres: ['Жахи', 'Трилер'],
            posterUrl: 'https://cdn.planetakino.ua/10187_28-years-later_2025/Media/Posters/vertical/opt_fc8ce5ad-f3c6-433f-86b6-7fa4515ec819.webp',
            backdropUrl: 'https://cdn.planetakino.ua/10187_28-years-later_2025/Media/Covers/horizontal/opt_f8681fb4-7b41-4823-9c94-46b79e55dfa9.webp',
            trailerUrl: 'https://www.youtube.com/watch?v=e67K9lCl8qY&pp=ygUpMjgg0YDQvtC60ZbQsiDQv9C-0YLQvtC80YMg0YLRgNC10LnQu9C10YA%3D',
            description: 'Вірус повертається через три десятиліття.' },
        { title: 'Трон: Арес', year: 2025, durationMin: 135, rating: 7.6, director: 'Йоахім Реннінг', genres: ['Фантастика'],
            posterUrl: 'https://upload.wikimedia.org/wikipedia/uk/thumb/f/f3/%D0%A2%D1%80%D0%BE%D0%BD_%D0%90%D1%80%D0%B5%D1%81_2025.png/250px-%D0%A2%D1%80%D0%BE%D0%BD_%D0%90%D1%80%D0%B5%D1%81_2025.png',
            backdropUrl: 'https://media.themoviedb.org/t/p/w780/min9ZUDZbiguTiQ7yz1Hbqk78HT.jpg',
            trailerUrl: 'https://www.youtube.com/watch?v=fHbAkUF2ssw&pp=ygUg0YLRgNC-0L0g0LDRgNC10YEg0YLRgNC10LnQu9C10YA%3D',
            description: 'Програма переходить у фізичний світ.' },
        { title: 'Місія нездійсненна 8', year: 2025, durationMin: 165, rating: 8.2, director: 'Крістофер Маккворрі', genres: ['Бойовик', 'Пригоди'],
            posterUrl: 'https://cdn.planetakino.ua/9069_mission-impossible-the-final-reckoning_2024/Media/Posters/vertical/opt_f6b487e0-45f2-45fe-8d57-078e142c61a7.webp',
            backdropUrl: 'https://itc.ua/wp-content/uploads/2024/10/03xzkttukb-scaled.webp',
            trailerUrl: 'https://www.youtube.com/watch?v=qLvLGlFFkWg&pp=ygUy0LzRltGB0ZbRjyDQvdC10LfQtNGW0LnRgdC90LXQvdC90LAg0YLRgNC10LnQu9C10YA%3D',
            description: 'Фінал боротьби з Сутністю.' },
        { title: 'Дюна: Частина друга', year: 2024, durationMin: 166, rating: 8.9, director: 'Дені Вільньов', genres: ['Фантастика', 'Драма'],
            posterUrl: 'https://www.palladium-cinema.com.ua/storage/upload/film/dyuna-chastina-druga-dune-part-two/e460aa944b63705d3e2ebce8b9b3b8c7eb1330aa.jpg',
            backdropUrl: 'https://static.sweet.tv/images/cache/v3/movie_banner/CN_UARICZW4YAQ==/new-254335-dune-part-two_1280x720.jpg',
            trailerUrl: 'https://www.youtube.com/watch?v=DtR76pz517E&pp=ygUo0LTRjtC90LAg0YfQsNGB0YLQuNC90LAgMiDRgtGA0LXQudC70LXRgA%3D%3D',
            description: 'Епічне завершення саги про Арракіс.' }
    ];

    const createdMovies = [];
    for (const m of moviesList) {
        const movie = await prisma.movie.create({
            data: {
                title: m.title,
                year: m.year,
                durationMin: m.durationMin,
                posterUrl: m.posterUrl,
                backdropUrl: m.backdropUrl,
                trailerUrl: m.trailerUrl.replace('watch?v=', 'embed/'),

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
        createdMovies.push(movie);
    }
    // 5. КІНОТЕАТРИ ТА ЗАЛИ
    console.log('🏢 Створення кінотеатрів...');
    const allHalls = [];
    for (const city of cities) {
        const theater = await prisma.theater.create({
            data: {
                name: `Cinema City ${city.name}`,
                cityId: city.id,
                address: 'Центральна площа, 1',
                coords: `${city.lat},${city.lng}`,
                halls: {
                    create: [
                        {
                            name: 'Зал 1 IMAX',
                            totalSeats: 100,
                            seats: {
                                create: Array.from({ length: 100 }, (_, i) => ({
                                    rowNum: Math.floor(i / 10) + 1,
                                    seatNum: (i % 10) + 1,
                                    type: i < 20 ? 'vip' : 'standard'
                                }))
                            }
                        }
                    ]
                }
            },
            include: { halls: true }
        });
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

    // 7. СЕАНСИ
    console.log('🎟️ Створення актуальних сеансів...');
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
        const date = new Date('2026-01-17');
        date.setDate(date.getDate() + dayOffset);

        for (const movie of createdMovies) {
            const randomHall = allHalls[Math.floor(Math.random() * allHalls.length)];
            const sessionDate = new Date(date);
            sessionDate.setHours(12 + (movie.id % 4) * 2, 0, 0, 0);

            await prisma.showtime.create({
                data: {
                    startTime: sessionDate,
                    price: 200.0,
                    movieId: movie.id,
                    hallId: randomHall.id
                }
            });
        }
    }

    console.log('🎉 БАЗУ ДАНИХ УСПІШНО ЗАПОВНЕНО!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());