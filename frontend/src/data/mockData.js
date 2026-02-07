export const GENRES = [
    "Екшн", "Пригоди", "Комедія", "Драма", "Фентезі",
    "Жахи", "Романтика", "Наукова фантастика", "Трилер", "Анімація",
    "Документальний", "Сімейний", "Містика", "Кримінал", "Вестерн"
];

export const MOVIES = [
    {
        id: "m1",
        title: "Дюна: Частина друга",
        year: 2024,
        durationMin: 166,
        genres: ["Наукова фантастика", "Екшн", "Драма"],
        rating: 8.7,
        poster: "src/assets/posters/duna-part-two.jpg",
        trailerUrl: "https://www.youtube.com/embed/U2Qp5pL3ovA",
        cast: ["Тімоти Шаламе", "Зендея", "Ребекка Фергюсон"],
        director: "Дені Вільньов",
        description: "Продовження епічної саги про Пола Атріда. Герой об'єднується з фременами для війни проти імперії.",
    },
    {
        id: "m2",
        title: "Дедпул та Росомаха",
        year: 2024,
        durationMin: 127,
        genres: ["Екшн", "Комедія", "Наукова фантастика"],
        rating: 8.3,
        poster: "src/assets/posters/deadpool-rosomaha.jpg",
        trailerUrl: "https://www.youtube.com/embed/73_1biulkY8",
        cast: ["Райан Рейнольдс", "Хью Джекман", "Емма Коррін"],
        director: "Шон Леві",
        description: "Дедпул приєднується до Росомахи в божевільній подорожі крізь мультивсесвіт Marvel.",
    },
    {
        id: "m3",
        title: "Кунг-фу Панда 4",
        year: 2024,
        durationMin: 94,
        genres: ["Анімація", "Комедія", "Пригоди"],
        rating: 7.6,
        poster: "src/assets/posters/kung-fu-panda.jpg",
        trailerUrl: "https://www.youtube.com/embed/_inKs4eeHiI",
        cast: ["Джек Блек", "Аквафіна", "Віола Девіс"],
        director: "Майк Мітчелл",
        description: "По повертається у новій пригоді разом із хитрим лисицем Чжень, щоб протистояти могутньому лиходію.",
    },
    {
        id: "m4",
        title: "Годзіла та Конг: Нова імперія",
        year: 2024,
        durationMin: 115,
        genres: ["Екшн", "Фентезі", "Наукова фантастика"],
        rating: 7.4,
        poster: "src/assets/posters/godzilla-and-kong.jpg",
        trailerUrl: "https://www.youtube.com/embed/ZgCg4N6aPLA",
        cast: ["Ребекка Холл", "Брайан Тайрі Генрі", "Ден Стівенс"],
        director: "Адам Вінгард",
        description: "Годзіла та Конг об'єднуються проти спільного ворога, який загрожує всій планеті.",
    },
    {
        id: "m5",
        title: "Білий Ворон",
        year: 2024,
        durationMin: 105,
        genres: ["Драма", "Трилер", "Кримінал"],
        rating: 8.1,
        poster: "src/assets/posters/white-raven.jpg",
        trailerUrl: "https://www.youtube.com/embed/7L4pUY0bL_c",
        cast: ["Олег Меньшиков", "Анна Михалкова", "Сергій Гармаш"],
        director: "Олексій Учитель",
        description: "Детективна драма про розслідування загадкового злочину в сучасній Москві.",
    },
    {
        id: "m6",
        title: "Відьми. Частина друга",
        year: 2024,
        durationMin: 98,
        genres: ["Фентезі", "Жахи", "Трилер"],
        rating: 7.8,
        poster: "src/assets/posters/witch.jpg",
        trailerUrl: "https://www.youtube.com/embed/yjRHZEUamCc",
        cast: ["Александр Петров", "Тіна Канделакі", "Микита Ефремов"],
        director: "Олег Трофім",
        description: "Продовження містичної історії про боротьбу з темними силами в сучасному світі.",
    },
    {
        id: "m7",
        title: "Людина-павук: Крізь всесвіт",
        year: 2023,
        durationMin: 140,
        genres: ["Анімація", "Екшн", "Пригоди"],
        rating: 9.0,
        poster: "src/assets/posters/spider-man.jpg",
        trailerUrl: "https://www.youtube.com/embed/shW9i6k8cB0",
        cast: ["Шамейк Мур", "Хейлі Стайнфелд", "Оскар Айзек"],
        director: "Хоакім Дос Сантос",
        description: "Майлз Моралес подорожує крізь мультивсесвіт, де зустрічає команду Людей-павуків.",
    },
    {
        id: "m8",
        title: "Оппенгеймер",
        year: 2023,
        durationMin: 180,
        genres: ["Драма", "Біографічний", "Історичний"],
        rating: 8.8,
        poster: "src/assets/posters/oppenheimer.jpg",
        trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg",
        cast: ["Кілліан Мерфі", "Емілі Блант", "Метт Деймон"],
        director: "Крістофер Нолан",
        description: "Біографічна драма про Роберта Оппенгеймера, творця атомної бомби.",
    },
    {
        id: "m9",
        title: "Барбі",
        year: 2023,
        durationMin: 114,
        genres: ["Комедія", "Пригоди", "Фентезі"],
        rating: 7.9,
        poster: "src/assets/posters/barbie.jpg",
        trailerUrl: "https://www.youtube.com/embed/pBk4NYhWNMM",
        cast: ["Марґот Роббі", "Раян Гослінг", "Америка Феррера"],
        director: "Грета Гервіг",
        description: "Барбі вирушає з ідеального світу Барбіленду в реальний світ на пошуки справжнього щастя.",
    },
    {
        id: "m10",
        title: "Міграція",
        year: 2023,
        durationMin: 92,
        genres: ["Анімація", "Комедія", "Пригоди"],
        rating: 7.5,
        poster: "src/assets/posters/migration.jpg",
        trailerUrl: "https://www.youtube.com/embed/cQfo0HJhCnE",
        cast: ["Кумейл Нанджіані", "Елізабет Бенкс", "Денні Девіто"],
        director: "Бенджамін Реннер",
        description: "Сімейство качок вирушає у незабутню подорож з Нової Англії до Ямайки.",
    }
];

export const THEATERS = [
    {
        id: "t1",
        name: "Кіномісто Центр",
        city: "Київ",
        lat: 50.4501,
        lng: 30.5234,
        address: "вул. Хрещатик, 1",
        phone: "+380 44 000 00 01",
        halls: [
            { id: "h1", name: "Зал А", seats: 80 },
            { id: "h2", name: "Зал Б", seats: 120 },
            { id: "h3", name: "Зал В (VIP)", seats: 50 },
        ],
    },
    {
        id: "t2",
        name: "Ріверсайд Мультиплекс",
        city: "Львів",
        lat: 49.8397,
        lng: 24.0297,
        address: "просп. Свободи, 12",
        phone: "+380 32 000 00 02",
        halls: [
            { id: "h4", name: "Зал 1", seats: 60 },
            { id: "h5", name: "Зал 2 (IMAX)", seats: 200 },
        ],
    },
    {
        id: "t3",
        name: "Зірка Кіно",
        city: "Київ",
        lat: 50.4547,
        lng: 30.5238,
        address: "бульв. Шевченка, 5",
        phone: "+380 44 111 11 11",
        halls: [
            { id: "h6", name: "Червоний зал", seats: 100 },
            { id: "h7", name: "Синій зал", seats: 120 },
            { id: "h8", name: "Зелений зал (3D)", seats: 150 },
        ],
    },
    {
        id: "t4",
        name: "Океан Плаза Кіно",
        city: "Київ",
        lat: 50.4414,
        lng: 30.5222,
        address: "вул. Антоновича, 176",
        phone: "+380 44 222 22 22",
        halls: [
            { id: "h9", name: "Зал 1", seats: 80 },
            { id: "h10", name: "Зал 2", seats: 90 },
            { id: "h11", name: "Зал 3 (4DX)", seats: 120 },
        ],
    },
    {
        id: "t5",
        name: "Планета Кіно",
        city: "Львів",
        lat: 49.8430,
        lng: 24.0265,
        address: "вул. Городоцька, 36",
        phone: "+380 32 333 33 33",
        halls: [
            { id: "h12", name: "Головний зал", seats: 180 },
            { id: "h13", name: "Студійний зал", seats: 70 },
        ],
    },
    {
        id: "t6",
        name: "Мультиплекс",
        city: "Одеса",
        lat: 46.4825,
        lng: 30.7233,
        address: "вул. Дерибасівська, 22",
        phone: "+380 48 444 44 44",
        halls: [
            { id: "h14", name: "Класичний зал", seats: 110 },
            { id: "h15", name: "Преміум зал", seats: 60 },
        ],
    },
    {
        id: "t7",
        name: "Кінопалац",
        city: "Харків",
        lat: 49.9935,
        lng: 36.2304,
        address: "вул. Сумська, 35",
        phone: "+380 57 555 55 55",
        halls: [
            { id: "h16", name: "Зал 1", seats: 130 },
            { id: "h17", name: "Зал 2", seats: 130 },
            { id: "h18", name: "IMAX зал", seats: 250 },
        ],
    },
    {
        id: "t8",
        name: "Сінема Сіті",
        city: "Дніпро",
        lat: 48.4647,
        lng: 35.0462,
        address: "Набережна, 15",
        phone: "+380 56 666 66 66",
        halls: [
            { id: "h19", name: "Малий зал", seats: 40 },
            { id: "h20", name: "Головний зал", seats: 90 },
        ],
    }
];

export const SHOWTIMES = [
    // Дюна 2 - січень 2026
    { id: "s1", movieId: "m1", theaterId: "t1", hallId: "h1", start: "10:00", date: "2026-01-15", price: 180 },
    { id: "s2", movieId: "m1", theaterId: "t1", hallId: "h2", start: "14:10", date: "2026-01-15", price: 210 },
    { id: "s3", movieId: "m1", theaterId: "t1", hallId: "h3", start: "19:30", date: "2026-01-15", price: 260 },
    { id: "s4", movieId: "m1", theaterId: "t3", hallId: "h6", start: "11:30", date: "2026-01-16", price: 190 },
    { id: "s44", movieId: "m1", theaterId: "t4", hallId: "h6", start: "21:00", date: "2026-01-16", price: 210 },

    // Дедпул та Росомаха - січень 2026
    { id: "s5", movieId: "m2", theaterId: "t3", hallId: "h7", start: "16:45", date: "2026-01-15", price: 210 },
    { id: "s6", movieId: "m2", theaterId: "t4", hallId: "h9", start: "12:15", date: "2026-01-15", price: 170 },
    { id: "s7", movieId: "m2", theaterId: "t4", hallId: "h10", start: "18:00", date: "2026-01-17", price: 200 },

    // Кунг-фу Панда 4 - січень 2026
    { id: "s8", movieId: "m3", theaterId: "t1", hallId: "h1", start: "09:30", date: "2026-01-15", price: 160 },
    { id: "s9", movieId: "m3", theaterId: "t3", hallId: "h8", start: "15:20", date: "2026-01-16", price: 220 },

    // Годзіла та Конг - січень 2026
    { id: "s10", movieId: "m4", theaterId: "t2", hallId: "h4", start: "11:00", date: "2026-01-15", price: 190 },
    { id: "s11", movieId: "m4", theaterId: "t2", hallId: "h5", start: "17:30", date: "2026-01-18", price: 240 },

    // Білий Ворон - січень 2026
    { id: "s12", movieId: "m5", theaterId: "t5", hallId: "h12", start: "13:45", date: "2026-01-15", price: 200 },
    { id: "s13", movieId: "m5", theaterId: "t2", hallId: "h4", start: "16:00", date: "2026-01-16", price: 190 },

    // Відьми 2 - січень 2026
    { id: "s14", movieId: "m6", theaterId: "t5", hallId: "h13", start: "20:15", date: "2026-01-15", price: 230 },
    { id: "s15", movieId: "m6", theaterId: "t2", hallId: "h5", start: "19:00", date: "2026-01-18", price: 250 },

    // Людина-павук - січень 2026
    { id: "s16", movieId: "m7", theaterId: "t6", hallId: "h14", start: "14:30", date: "2026-01-16", price: 200 },
    { id: "s17", movieId: "m7", theaterId: "t7", hallId: "h16", start: "16:20", date: "2026-01-17", price: 210 },

    // Оппенгеймер - січень 2026
    { id: "s18", movieId: "m8", theaterId: "t8", hallId: "h20", start: "18:45", date: "2026-01-18", price: 190 },
    { id: "s19", movieId: "m8", theaterId: "t6", hallId: "h15", start: "12:00", date: "2026-01-19", price: 220 },

    // Барбі - січень 2026
    { id: "s20", movieId: "m9", theaterId: "t7", hallId: "h18", start: "21:00", date: "2026-01-15", price: 280 },
    { id: "s21", movieId: "m9", theaterId: "t7", hallId: "h17", start: "19:30", date: "2026-01-19", price: 260 },

    // Міграція - січень 2026
    { id: "s22", movieId: "m10", theaterId: "t8", hallId: "h19", start: "10:30", date: "2026-01-15", price: 150 },
    { id: "s23", movieId: "m10", theaterId: "t4", hallId: "h11", start: "13:00", date: "2026-01-16", price: 170 },

    // Додаткові сеанси на різні дати
    { id: "s24", movieId: "m1", theaterId: "t4", hallId: "h11", start: "20:30", date: "2026-01-18", price: 300 },
    { id: "s25", movieId: "m2", theaterId: "t5", hallId: "h13", start: "15:00", date: "2026-01-19", price: 220 },
    { id: "s26", movieId: "m3", theaterId: "t6", hallId: "h14", start: "11:30", date: "2026-01-18", price: 180 },
    { id: "s27", movieId: "m4", theaterId: "t7", hallId: "h16", start: "14:45", date: "2026-01-16", price: 210 },
    { id: "s28", movieId: "m5", theaterId: "t8", hallId: "h20", start: "17:15", date: "2026-01-18", price: 190 },
    { id: "s29", movieId: "m6", theaterId: "t1", hallId: "h2", start: "22:00", date: "2026-01-19", price: 240 },
    { id: "s30", movieId: "m7", theaterId: "t2", hallId: "h5", start: "13:20", date: "2026-01-16", price: 230 }
];

// Отримати унікальні міста з кінотеатрів
export const CITIES = [...new Set(THEATERS.map(theater => theater.city))];

// Отримати унікальні дати з сеансів для фільтрації
export const SHOWTIME_DATES = [...new Set(SHOWTIMES.map(showtime => showtime.date))].sort();