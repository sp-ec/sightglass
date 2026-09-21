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

-- The application is in "initialization mode" while this table is empty;
-- the first account created through /api/auth/setup is always the admin
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness without requiring the citext extension.
-- These also serve as the lookup path for WHERE LOWER(email) = LOWER($1).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username));

-- token_hash is the hex SHA-256 of the opaque token held in the session cookie
CREATE TABLE IF NOT EXISTS sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

-- This file re-runs on every boot, so "INSERT ... WHERE NOT EXISTS (SELECT 1
-- FROM t)" would resurrect defaults an admin deliberately deleted. An explicit
-- flag distinguishes "never seeded" from "intentionally empty".
CREATE TABLE IF NOT EXISTS app_settings_seed_flags (
    seed_key VARCHAR(64) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exactly one row, forever: the primary key plus CHECK (id = 1) makes a second
-- row impossible at the database level rather than by convention.
-- Every multiplier is DOUBLE PRECISION, never NUMERIC: node-pg returns NUMERIC
-- as a JS string, which would force a cast at every read site.
CREATE TABLE IF NOT EXISTS app_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

    registration_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Never leaves the service layer in plaintext; the API returns a mask
    steam_api_key TEXT,

    review_multiplier_baseline DOUBLE PRECISION NOT NULL DEFAULT 35,
    review_multiplier_min DOUBLE PRECISION NOT NULL DEFAULT 15,
    review_multiplier_max DOUBLE PRECISION NOT NULL DEFAULT 120,

    audience_divisor DOUBLE PRECISION NOT NULL DEFAULT 1000 CHECK (audience_divisor > 0),
    audience_exponent DOUBLE PRECISION NOT NULL DEFAULT 0.07,

    -- How to combine several matching tag multipliers
    tag_resolution VARCHAR(10) NOT NULL DEFAULT 'average'
        CHECK (tag_resolution IN ('average', 'minimum', 'maximum')),

    -- min is the floor the yearly decay bottoms out at, so it sits below starting
    realized_price_min_multiplier DOUBLE PRECISION NOT NULL DEFAULT 0.65,
    realized_price_starting_multiplier DOUBLE PRECISION NOT NULL DEFAULT 0.92,
    realized_price_per_year_multiplier DOUBLE PRECISION NOT NULL DEFAULT 0.055,
    realized_price_refund_rate_min DOUBLE PRECISION NOT NULL DEFAULT 0.04,
    realized_price_refund_rate_multiplier DOUBLE PRECISION NOT NULL DEFAULT 0.25,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (realized_price_min_multiplier <= realized_price_starting_multiplier),
    -- Above 1 a zero-positive game would produce a negative revenue estimate
    CHECK (realized_price_refund_rate_min + realized_price_refund_rate_multiplier <= 1)
);

INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- tag_id as the primary key enforces one multiplier per tag in the database
CREATE TABLE IF NOT EXISTS estimation_tag_multipliers (
    tag_id INTEGER PRIMARY KEY REFERENCES tags(id) ON DELETE CASCADE,
    mult DOUBLE PRECISION NOT NULL CHECK (mult > 0)
);

-- above = FALSE means "price <= price_in_cents"; TRUE means "price >".
-- The unique key is the pair: the defaults below include both <=3000 and >3000.
CREATE TABLE IF NOT EXISTS estimation_price_multipliers (
    id SERIAL PRIMARY KEY,
    price_in_cents INTEGER NOT NULL CHECK (price_in_cents >= 0),
    multiplier DOUBLE PRECISION NOT NULL CHECK (multiplier > 0),
    above BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (price_in_cents, above)
);

CREATE TABLE IF NOT EXISTS estimation_uncertainty_bands (
    id SERIAL PRIMARY KEY,
    review_count INTEGER NOT NULL CHECK (review_count >= 0),
    low DOUBLE PRECISION NOT NULL CHECK (low > 0),
    high DOUBLE PRECISION NOT NULL CHECK (high > 0),
    above BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (review_count, above),
    CHECK (low <= high)
);

INSERT INTO estimation_price_multipliers (price_in_cents, multiplier, above)
SELECT * FROM (VALUES
    ( 500, 1.25::double precision, FALSE),
    (1000, 1.10,                   FALSE),
    (3000, 1.00,                   FALSE),
    (3000, 0.90,                   TRUE)
) AS d(price_in_cents, multiplier, above)
WHERE NOT EXISTS (
    SELECT 1 FROM app_settings_seed_flags WHERE seed_key = 'price_multipliers'
);

INSERT INTO app_settings_seed_flags (seed_key) VALUES ('price_multipliers')
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO estimation_uncertainty_bands (review_count, low, high, above)
SELECT * FROM (VALUES
    (100, 0.40::double precision, 2.5::double precision, FALSE),
    (500, 0.50,                   2.0,                   FALSE),
    (500, 0.55,                   1.8,                   TRUE)
) AS d(review_count, low, high, above)
WHERE NOT EXISTS (
    SELECT 1 FROM app_settings_seed_flags WHERE seed_key = 'uncertainty_bands'
);

INSERT INTO app_settings_seed_flags (seed_key) VALUES ('uncertainty_bands')
ON CONFLICT (seed_key) DO NOTHING;

-- Best-effort seed for databases that already have tags. On a fresh database
-- the tags table is empty and this inserts nothing, so it does not set the seed
-- flag; ensureDefaultTagMultipliers() retries after the first tag sync.
INSERT INTO estimation_tag_multipliers (tag_id, mult)
SELECT t.id, d.mult
FROM (VALUES
    ('Visual Novel', 0.7::double precision),
    ('Narrative',    0.7),
    ('Multiplayer',  1.2),
    ('Co-op',        1.2),
    ('Survival',     1.2)
) AS d(name, mult)
JOIN tags t ON LOWER(t.name) = LOWER(d.name)
WHERE NOT EXISTS (
    SELECT 1 FROM app_settings_seed_flags WHERE seed_key = 'tag_multipliers'
)
ON CONFLICT (tag_id) DO NOTHING;

-- === Schema evolution ===
-- CREATE TABLE IF NOT EXISTS does nothing to a table that already exists, so a
-- new column must be added BOTH to the CREATE TABLE above (for fresh databases)
-- AND here (for existing ones). ADD COLUMN IF NOT EXISTS is idempotent, so this
-- section is safe to re-run on every boot. Example:
-- ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS foo DOUBLE PRECISION NOT NULL DEFAULT 1;