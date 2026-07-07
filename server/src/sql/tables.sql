CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS games (
    app_id INTEGER PRIMARY KEY UNIQUE NOT NULL,
    name VARCHAR(1000) NOT NULL,
    type INTEGER,
    parent_app_id INTEGER,
    store_url_path TEXT,
    steam_release_date TIMESTAMP,
    price_in_cents INTEGER,
    short_description TEXT,
    rating_type VARCHAR(50),
    rating VARCHAR(10),
    last_updated TIMESTAMP
);

CREATE INDEX IF NOT EXISTS games_name_trgm_idx ON games USING GIN (name gin_trgm_ops);

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

create table if not exists categories (
   id         integer unique not null primary key,
   type       integer not null,
   name       varchar(255) unique not null,
   image_path varchar(255) not null
);
create table if not exists game_categories (
   game_id       integer
      references games ( app_id )
         on delete cascade,
   category_id   integer not null,
   category_type varchar(50) not null,
   primary key ( game_id,
                 category_id,
                 category_type )
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

CREATE TABLE IF NOT EXISTS languages (
    id INTEGER UNIQUE NOT NULL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL
);

INSERT INTO languages (id, code, name) VALUES
    (0, 'en', 'English'),
    (1, 'de', 'German'),
    (2, 'fr', 'French'),
    (3, 'it', 'Italian'),
    (4, 'ko', 'Korean'),
    (5, 'es', 'Spanish'),
    (6, 'zh-CN', 'Simplified Chinese'),
    (7, 'zh-TW', 'Traditional Chinese'),
    (8, 'ru', 'Russian'),
    (9, 'th', 'Thai'),
    (10, 'ja', 'Japanese'),
    (11, 'pt', 'Portuguese'),
    (12, 'pl', 'Polish'),
    (13, 'da', 'Danish'),
    (14, 'nl', 'Dutch'),
    (15, 'fi', 'Finnish'),
    (16, 'no', 'Norwegian'),
    (17, 'sv', 'Swedish'),
    (18, 'ro', 'Romanian'),
    (19, 'tr', 'Turkish'),
    (20, 'hu', 'Hungarian'),
    (21, 'cs', 'Czech'),
    (22, 'pt-BR', 'Brazilian Portuguese'),
    (23, 'bg', 'Bulgarian'),
    (24, 'el', 'Greek'),
    (25, 'ar', 'Arabic'),
    (26, 'uk', 'Ukrainian'),
    (27, 'es-419', 'Latin American Spanish'),
    (28, 'vi', 'Vietnamese'),
    (29, 'id', 'Indonesian'),
    (30, 'ms', 'Malay')
ON CONFLICT (id) DO NOTHING;

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