// Internationalization dictionary (Ukrainian default, Russian switchable)
const translations = {
  ua: {
    // Navigation
    nav_calc: 'Калькулятор рангів',
    nav_catalog: 'Каталог послуг',
    nav_tracker: 'Мої замовлення',
    nav_reviews: 'Відгуки',
    nav_guarantee: 'Гарантії',
    nav_admin: 'Адмін-панель',
    nav_booster_panel: 'Кабінет бустера',
    nav_login: 'Увійти',
    nav_logout: 'Вийти',
    nav_cart: 'Кошик',

    // Hero
    hero_badge: '⚡ ПРОФЕСІЙНИЙ ГЕЙМІНГ-БУСТ # В УКРАЇНІ ТА ЄВРОПІ',
    hero_title_1: 'ПІДВИЩУЙ СВІЙ РАНГ',
    hero_title_2: 'З ТОП-100 ГРАВЦЯМИ',
    hero_subtitle: 'Швидкий, безпечний та анонімний буст у Valorant, CS2, League of Legends та Dota 2. Початок через 10 хвилин після замовлення.',
    hero_btn_calc: 'Розрахувати буст',
    hero_btn_catalog: 'Переглянути каталог',
    hero_stat_1_val: '14,800+',
    hero_stat_1_lbl: 'Виконаних замовлень',
    hero_stat_2_val: '99.4%',
    hero_stat_2_lbl: 'Вінрейт бустерів',
    hero_stat_3_val: '10 хв',
    hero_stat_3_lbl: 'Середній час старту',
    hero_stat_4_val: '4.98 / 5',
    hero_stat_4_lbl: 'Середня оцінка клієнтів',

    // Calculator
    calc_title: 'ІНТЕРАКТИВНИЙ КАЛЬКУЛЯТОР РАНГІВ',
    calc_subtitle: 'Оберіть вашу гру, поточний та бажаний ранг для миттєвого розрахунку ціни та термінів',
    calc_tab_val: 'Valorant',
    calc_tab_cs2: 'Counter-Strike 2',
    calc_tab_lol: 'League of Legends',
    calc_tab_dota2: 'Dota 2',
    calc_current_rank: 'Поточний ранг',
    calc_target_rank: 'Бажаний ранг',
    calc_extra_options: 'Додаткові опції бусту',
    calc_opt_duo: 'Duo Queue (Грати разом з бустером) (+40%)',
    calc_opt_stream: 'Приватний стрім у Discord/Twitch (+$5)',
    calc_opt_priority: 'VIP Express (Пріоритетний старт) (+25%)',
    calc_opt_offline: 'Offline режим у Steam / Riot (Безкоштовно)',
    calc_opt_agent: 'Вибір улюбленого героя / агента (+$4)',
    calc_summary_title: 'Підсумок замовлення',
    calc_summary_time: 'Орієнтовний час:',
    calc_summary_price: 'Сума до сплати:',
    calc_btn_order: '⚡ Замовити буст зараз',
    calc_btn_add_cart: '🛒 Додати в кошик',

    // Catalog
    catalog_title: 'КАТАЛОГ ГОТОВИХ ПОСЛУГ',
    catalog_subtitle: 'Калібрування, пакети перемог, коучинг від про-гравців та індивідуальні завдання',
    cat_all: 'Усі послуги',
    cat_valorant: 'Valorant',
    cat_cs2: 'CS2',
    cat_lol: 'LoL',
    cat_dota2: 'Dota 2',
    cat_coaching: 'Коучинг',
    cat_placement: 'Калібрування',
    cat_btn_buy: 'Замовити',
    cat_btn_cart: 'В кошик',

    // Trust & Features
    features_title: 'ЧОМУ ОБИРАЮТЬ CYBERBOOST?',
    feat_1_title: 'Повна анонімність та VPN',
    feat_1_desc: 'Бустери грають виключно з VPN вашої країни та міста, без відповідей друзям у чаті.',
    feat_2_title: 'Тільки верифіковані Pro',
    feat_2_desc: 'Усі наші виконавці — це гравці Radiant, Faceit 10 (3000+ ELO), Challenger та Immortal топ-100.',
    feat_3_title: 'Онлайн-трекінг та стрім',
    feat_3_desc: 'Слідкуйте за кожною грою в реальному часі через особистий кабінет та прямий стрім.',
    feat_4_title: '100% Гарантія повернення',
    feat_4_desc: 'Якщо ви не задоволені результатом або виникнуть непередбачені обставини — повертаємо кошти.',

    // Reviews
    reviews_title: 'ВІДГУКИ НАШИХ КЛІЄНТІВ',
    reviews_subtitle: 'Більше 500 реальних відгуків на Discord та Trustpilot',

    // Cart & Checkout
    cart_title: 'Ваш кошик',
    cart_empty: 'Кошик порожній. Оберіть послугу в каталозі або налаштуйте буст у калькуляторі!',
    cart_promo_ph: 'Промокод (напр. CYBER2026, UKRAINE)',
    cart_btn_apply: 'Застосувати',
    cart_discount: 'Знижка за промокодом:',
    cart_total: 'Разом:',
    cart_btn_checkout: 'Перейти до оформлення',
    checkout_title: 'Оформлення замовлення',
    checkout_acc_info: 'Дані акаунту (безпечно через SSL)',
    checkout_srv_lbl: 'Сервер / Регіон:',
    checkout_login_lbl: 'Riot ID / Steam / BattleTag / Логін:',
    checkout_discord_lbl: 'Ваш Discord / Telegram для зв’язку:',
    checkout_notes_lbl: 'Побажання / Графік гри:',
    checkout_pay_method: 'Спосіб оплати:',
    checkout_pay_card: 'Банківська картка (Visa / Mastercard)',
    checkout_pay_mono: 'Monobank / Privat24',
    checkout_pay_crypto: 'Криптовалюта (USDT TRC20, BTC, ETH)',
    checkout_pay_apple: 'Apple Pay / Google Pay',
    checkout_btn_submit: '🔒 Підтвердити та оплатити',

    // Tracker & Orders
    tracker_title: 'МОЇ ЗАМОВЛЕННЯ ТА ТРЕКЕР',
    tracker_no_orders: 'У вас ще немає активних замовлень.',
    tracker_progress: 'Прогрес виконання:',
    tracker_status_paid: 'Оплачено (Очікує бустера)',
    tracker_status_in_progress: 'У процесі виконання',
    tracker_status_completed: 'Виконано на 100% 🎉',
    tracker_booster_assigned: 'Призначений виконавець:',
    tracker_booster_none: 'Підбираємо найкращого бустера...',
    tracker_stream_active: '🔴 Прямий ефір гри активний: ',
    tracker_timeline_title: 'Історія та події бусту:',
    tracker_btn_chat: '💬 Чат із бустером',

    // Chat
    chat_title: 'Чат підтримки та зв’язку з бустером',
    chat_ph: 'Напишіть повідомлення...',
    chat_send: 'Надіслати',
    chat_typing: 'друкує...',

    // Admin & Booster Dashboard
    admin_title: '⚡ Адмін-панель керування CyberBoost',
    admin_tab_orders: 'Замовлення',
    admin_tab_services: 'Керування послугами',
    admin_tab_users: 'Користувачі',
    admin_tab_stats: 'Аналітика',
    booster_title: 'Кабінет бустера CyberBoost',
    booster_tab_available: 'Доступні замовлення',
    booster_tab_my: 'Мої активні замовлення',

    // Notifications
    push_title: 'Увімкнути сповіщення?',
    push_desc: 'Отримуйте миттєві сповіщення про старт гри, підняття рангу та повідомлення бустера.',
    push_btn_allow: 'Дозволити сповіщення',
    push_btn_later: 'Пізніше'
  },

  ru: {
    // Navigation
    nav_calc: 'Калькулятор рангов',
    nav_catalog: 'Каталог услуг',
    nav_tracker: 'Мои заказы',
    nav_reviews: 'Отзывы',
    nav_guarantee: 'Гарантии',
    nav_admin: 'Админ-панель',
    nav_booster_panel: 'Кабинет бустера',
    nav_login: 'Войти',
    nav_logout: 'Выйти',
    nav_cart: 'Корзина',

    // Hero
    hero_badge: '⚡ ПРОФЕССИОНАЛЬНЫЙ ГЕЙМИНГ-БУСТ #1 В ЕВРОПЕ',
    hero_title_1: 'ПОВЫШАЙ СВОЙ РАНГ',
    hero_title_2: 'С ТОП-100 ИГРОКАМИ',
    hero_subtitle: 'Быстрый, безопасный и анонимный буст в Valorant, CS2, League of Legends и Dota 2. Старт через 10 минут после заказа.',
    hero_btn_calc: 'Рассчитать буст',
    hero_btn_catalog: 'Смотреть каталог',
    hero_stat_1_val: '14,800+',
    hero_stat_1_lbl: 'Выполненных заказов',
    hero_stat_2_val: '99.4%',
    hero_stat_2_lbl: 'Винрейт бустеров',
    hero_stat_3_val: '10 мин',
    hero_stat_3_lbl: 'Среднее время старта',
    hero_stat_4_val: '4.98 / 5',
    hero_stat_4_lbl: 'Средняя оценка клиентов',

    // Calculator
    calc_title: 'ИНТЕРАКТИВНЫЙ КАЛЬКУЛЯТОР РАНГОВ',
    calc_subtitle: 'Выберите игру, текущий и желаемый ранг для мгновенного расчета цены и сроков',
    calc_tab_val: 'Valorant',
    calc_tab_cs2: 'Counter-Strike 2',
    calc_tab_lol: 'League of Legends',
    calc_tab_dota2: 'Dota 2',
    calc_current_rank: 'Текущий ранг',
    calc_target_rank: 'Желаемый ранг',
    calc_extra_options: 'Дополнительные опции буста',
    calc_opt_duo: 'Duo Queue (Играть вместе с бустером) (+40%)',
    calc_opt_stream: 'Приватный стрим в Discord/Twitch (+$5)',
    calc_opt_priority: 'VIP Express (Приоритетный старт) (+25%)',
    calc_opt_offline: 'Offline режим в Steam / Riot (Бесплатно)',
    calc_opt_agent: 'Выбор любимого героя / агента (+$4)',
    calc_summary_title: 'Итог заказа',
    calc_summary_time: 'Ориентировочное время:',
    calc_summary_price: 'Сумма к оплате:',
    calc_btn_order: '⚡ Заказать буст сейчас',
    calc_btn_add_cart: '🛒 Добавить в корзину',

    // Catalog
    catalog_title: 'КАТАЛОГ ГОТОВЫХ УСЛУГ',
    catalog_subtitle: 'Калибровка, пакеты побед, коучинг от про-игроков и индивидуальные задачи',
    cat_all: 'Все услуги',
    cat_valorant: 'Valorant',
    cat_cs2: 'CS2',
    cat_lol: 'LoL',
    cat_dota2: 'Dota 2',
    cat_coaching: 'Коучинг',
    cat_placement: 'Калибровка',
    cat_btn_buy: 'Заказать',
    cat_btn_cart: 'В корзину',

    // Trust & Features
    features_title: 'ПОЧЕМУ ВЫБИРАЮТ CYBERBOOST?',
    feat_1_title: 'Полная анонимность и VPN',
    feat_1_desc: 'Бустеры играют исключительно с VPN вашей страны и города, не отвечая друзьям в чате.',
    feat_2_title: 'Только верифицированные Pro',
    feat_2_desc: 'Все исполнители — игроки Radiant, Faceit 10 (3000+ ELO), Challenger и Immortal топ-100.',
    feat_3_title: 'Онлайн-трекинг и стрим',
    feat_3_desc: 'Следите за каждой игрой в реальном времени через личный кабинет и прямой стрим.',
    feat_4_title: '100% Гарантия возврата',
    feat_4_desc: 'Если результат вас не устроит или возникнут форс-мажоры — гарантируем возврат средств.',

    // Reviews
    reviews_title: 'ОТЗЫВЫ НАШИХ КЛИЕНТОВ',
    reviews_subtitle: 'Более 500 реальных отзывов в Discord и Trustpilot',

    // Cart & Checkout
    cart_title: 'Ваша корзина',
    cart_empty: 'Корзина пуста. Выберите услугу в каталоге или настройте буст в калькуляторе!',
    cart_promo_ph: 'Промокод (напр. CYBER2026, UKRAINE)',
    cart_btn_apply: 'Применить',
    cart_discount: 'Скидка по промокоду:',
    cart_total: 'Итого:',
    cart_btn_checkout: 'Перейти к оформлению',
    checkout_title: 'Оформление заказа',
    checkout_acc_info: 'Данные аккаунта (безопасно через SSL)',
    checkout_srv_lbl: 'Сервер / Регион:',
    checkout_login_lbl: 'Riot ID / Steam / BattleTag / Логин:',
    checkout_discord_lbl: 'Ваш Discord / Telegram для связи:',
    checkout_notes_lbl: 'Пожелания / График игры:',
    checkout_pay_method: 'Способ оплаты:',
    checkout_pay_card: 'Банковская карта (Visa / Mastercard)',
    checkout_pay_mono: 'Monobank / Privat24',
    checkout_pay_crypto: 'Криптовалюта (USDT TRC20, BTC, ETH)',
    checkout_pay_apple: 'Apple Pay / Google Pay',
    checkout_btn_submit: '🔒 Подтвердить и оплатить',

    // Tracker & Orders
    tracker_title: 'МОИ ЗАКАЗЫ И ТРЕКЕР',
    tracker_no_orders: 'У вас пока нет активных заказов.',
    tracker_progress: 'Прогресс выполнения:',
    tracker_status_paid: 'Оплачено (Ожидает бустера)',
    tracker_status_in_progress: 'В процессе выполнения',
    tracker_status_completed: 'Выполнено на 100% 🎉',
    tracker_booster_assigned: 'Назначенный исполнитель:',
    tracker_booster_none: 'Подбираем лучшего бустера...',
    tracker_stream_active: '🔴 Прямой эфир игры активен: ',
    tracker_timeline_title: 'История и события буста:',
    tracker_btn_chat: '💬 Чат с бустером',

    // Chat
    chat_title: 'Чат поддержки и связи с бустером',
    chat_ph: 'Напишите сообщение...',
    chat_send: 'Отправить',
    chat_typing: 'печатает...',

    // Admin & Booster Dashboard
    admin_title: '⚡ Админ-панель управления CyberBoost',
    admin_tab_orders: 'Заказы',
    admin_tab_services: 'Управление услугами',
    admin_tab_users: 'Пользователи',
    admin_tab_stats: 'Аналитика',
    booster_title: 'Кабинет бустера CyberBoost',
    booster_tab_available: 'Доступные заказы',
    booster_tab_my: 'Мои активные заказы',

    // Notifications
    push_title: 'Включить уведомления?',
    push_desc: 'Получайте мгновенные оповещения о старте игры, повышении ранга и сообщениях бустера.',
    push_btn_allow: 'Разрешить уведомления',
    push_btn_later: 'Позже'
  }
};

let currentLang = localStorage.getItem('cyberboost_lang') || 'ua';

function setLanguage(lang) {
  if (!translations[lang]) lang = 'ua';
  currentLang = lang;
  localStorage.setItem('cyberboost_lang', lang);

  // Update text of elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  // Update active class on language toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  document.documentElement.lang = lang;
}

function t(key) {
  return translations[currentLang]?.[key] || translations['ua']?.[key] || key;
}
