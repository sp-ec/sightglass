CREATE TABLE IF NOT EXISTS games (
    app_id INTEGER PRIMARY KEY UNIQUE NOT NULL,
    name VARCHAR(255),
    type INTEGER,
    parent_app_id INTEGER,
    store_url_path TEXT,
    steam_release_date TIMESTAMP,
    price_in_cents INTEGER,
    short_description TEXT,
    rating_type VARCHAR(50),
    rating VARCHAR(10),
    last_updated TIMESTAMP
) ;

CREATE TABLE IF NOT EXISTS developers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS game_developers (
    game_id INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, developer_id)
);

CREATE TABLE IF NOT EXISTS publishers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS game_publishers (
    game_id INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    publisher_id INTEGER REFERENCES publishers(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, publisher_id)
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS game_tags (
    game_id INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL,
    weight INTEGER,
    PRIMARY KEY (game_id, tag_id)
);

CREATE TABLE IF NOT EXISTS game_categories (
    game_id INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL,
    category_type VARCHAR(50) NOT NULL, 
    PRIMARY KEY (game_id, category_id, category_type)
);

CREATE TABLE IF NOT EXISTS game_supported_languages (
    game_id INTEGER REFERENCES games(app_id) ON DELETE CASCADE,
    elanguage INTEGER NOT NULL,
    eadditionallanguage INTEGER,
    supported BOOLEAN,
    full_audio BOOLEAN,
    subtitles BOOLEAN,
    PRIMARY KEY (game_id, elanguage)
);

CREATE TABLE IF NOT EXISTS game_platforms (
    game_id INTEGER PRIMARY KEY REFERENCES games(app_id) ON DELETE CASCADE,
    windows BOOLEAN,
    mac BOOLEAN,
    steamos_linux BOOLEAN,
    steam_deck_compat_category INTEGER,
    steam_os_compat_category INTEGER
);

CREATE TABLE IF NOT EXISTS game_assets (
    game_id INTEGER PRIMARY KEY REFERENCES games(app_id) ON DELETE CASCADE,
    asset_url_format TEXT,
    main_capsule TEXT,
    small_capsule TEXT,
    header TEXT,
    page_background_path TEXT,
    hero_capsule TEXT,
    library_capsule TEXT,
    library_hero TEXT,
    community_icon TEXT
);

CREATE TABLE IF NOT EXISTS game_reviews_summary (
    game_id INTEGER PRIMARY KEY REFERENCES games(app_id) ON DELETE CASCADE,
    review_count INTEGER,
    percent_positive INTEGER,
    review_score INTEGER,
    review_score_label VARCHAR(100)
);