-- A deliberately unhealthy database, for exercising the database-monitoring page.
--
-- Every problem in here is a real one that the inspector finds by querying the
-- catalog, not a row typed into a findings table: two environments whose schemas have
-- drifted apart, a table whose daily volume collapsed, and four flavours of
-- redundancy. Load it into a throwaway Postgres and register the DSN under
-- Integrations → Databases.
--
--   docker exec -i lhb-demo-db psql -U lhb -d commerce < backend/seeds/demo_commerce.sql

DROP SCHEMA IF EXISTS prod CASCADE;
DROP SCHEMA IF EXISTS stage CASCADE;
CREATE SCHEMA prod;
CREATE SCHEMA stage;

-- ---------------------------------------------------------------- schema drift
-- prod and stage hold the same two tables. They have drifted four ways: a column
-- added on one side, a column dropped on the other, a widened type, and a widened
-- length. This is what a migration applied to one environment and not the other
-- actually looks like.

CREATE TABLE prod.orders (
    order_id     bigint PRIMARY KEY,
    customer_id  bigint      NOT NULL,
    status       varchar(16) NOT NULL,
    total        numeric(12,2) NOT NULL,
    currency     char(3)     NOT NULL,
    placed_at    timestamptz NOT NULL,
    created_date date        NOT NULL
);

CREATE TABLE stage.orders (
    order_id     bigint PRIMARY KEY,
    customer_id  bigint      NOT NULL,
    status       varchar(32) NOT NULL,   -- drift: varchar(16) in prod
    total        double precision NOT NULL, -- drift: numeric(12,2) in prod
    -- drift: prod.currency has no counterpart here
    promo_code   varchar(24),            -- drift: exists only in stage
    placed_at    timestamptz NOT NULL,
    created_date date        NOT NULL
);

CREATE TABLE prod.customers (
    customer_id bigint PRIMARY KEY,
    email       varchar(255) NOT NULL,
    country     char(2)      NOT NULL,
    deleted_at  timestamptz,             -- drift: soft-delete never reached stage
    created_date date        NOT NULL
);

CREATE TABLE stage.customers (
    customer_id bigint PRIMARY KEY,
    email       varchar(255) NOT NULL,
    country     char(2)      NOT NULL,
    created_date date        NOT NULL
);

-- ----------------------------------------------------------------- volume drop
-- Sixty days of steady ingestion, then a collapse three days ago: the shape a broken
-- upstream job leaves behind. The table keeps loading, so nothing is "down" — only the
-- daily count says anything is wrong.

CREATE TABLE prod.daily_events (
    event_id   bigserial PRIMARY KEY,
    event_date date        NOT NULL,
    source     varchar(32) NOT NULL,
    payload    jsonb       NOT NULL
);

INSERT INTO prod.daily_events (event_date, source, payload)
SELECT
    d::date,
    (ARRAY['checkout','search','cart','auth'])[1 + (n % 4)],
    jsonb_build_object('n', n)
FROM generate_series(CURRENT_DATE - 60, CURRENT_DATE - 4, interval '1 day') AS d
CROSS JOIN generate_series(1, 900) AS n;

-- The last three days: ~6% of the usual volume.
INSERT INTO prod.daily_events (event_date, source, payload)
SELECT
    d::date,
    'checkout',
    jsonb_build_object('n', n)
FROM generate_series(CURRENT_DATE - 3, CURRENT_DATE, interval '1 day') AS d
CROSS JOIN generate_series(1, 55) AS n;

-- A control: this one is loading normally, so the page is not uniformly red.
CREATE TABLE prod.order_items (
    item_id     bigserial PRIMARY KEY,
    order_id    bigint NOT NULL,
    sku         varchar(32) NOT NULL,
    qty         int NOT NULL,
    created_date date NOT NULL
);

INSERT INTO prod.order_items (order_id, sku, qty, created_date)
SELECT n, 'SKU-' || (n % 500), 1 + (n % 3), d::date
FROM generate_series(CURRENT_DATE - 30, CURRENT_DATE, interval '1 day') AS d
CROSS JOIN generate_series(1, 400) AS n;

-- ---------------------------------------------------------------- redundancies

-- 1. Duplicate index: same table, same column, created twice under different names.
CREATE INDEX idx_orders_customer     ON prod.orders (customer_id);
CREATE INDEX idx_orders_customer_dup ON prod.orders (customer_id);

-- 2. Prefix-redundant index: (status) is already served by (status, placed_at).
CREATE INDEX idx_orders_status         ON prod.orders (status);
CREATE INDEX idx_orders_status_placed  ON prod.orders (status, placed_at);

-- 3. Never-scanned index on a column nothing filters by.
CREATE INDEX idx_events_source ON prod.daily_events (source);

-- 4. No primary key, so nothing stops the same row landing twice.
CREATE TABLE prod.payments (
    payment_ref varchar(32) NOT NULL,
    order_id    bigint      NOT NULL,
    amount      numeric(12,2) NOT NULL,
    captured_at timestamptz NOT NULL
);

INSERT INTO prod.payments (payment_ref, order_id, amount, captured_at)
SELECT 'PAY-' || n, n, 19.99, now() - (n || ' minutes')::interval
FROM generate_series(1, 800) AS n;

-- The retry that was never de-duplicated: 120 rows written a second time, byte for byte.
INSERT INTO prod.payments
SELECT * FROM prod.payments WHERE order_id <= 120;

-- 5. A table with no primary key at all.
CREATE TABLE prod.audit_log (
    actor      varchar(128) NOT NULL,
    action     varchar(64)  NOT NULL,
    happened_at timestamptz NOT NULL
);

INSERT INTO prod.audit_log
SELECT 'user' || (n % 30) || '@example.test', 'update', now() - (n || ' hours')::interval
FROM generate_series(1, 400) AS n;

-- Populate the drifted tables so the schema comparison is not the only signal.
INSERT INTO prod.orders
SELECT n, n % 300, 'paid', 42.50, 'USD', now() - (n || ' minutes')::interval,
       (now() - (n || ' minutes')::interval)::date
FROM generate_series(1, 1000) AS n;

INSERT INTO stage.orders
SELECT n, n % 300, 'paid', 42.50, NULL, now() - (n || ' minutes')::interval,
       (now() - (n || ' minutes')::interval)::date
FROM generate_series(1, 50) AS n;

INSERT INTO prod.customers
SELECT n, 'c' || n || '@example.test', 'US', NULL, CURRENT_DATE - (n % 30)
FROM generate_series(1, 300) AS n;

INSERT INTO stage.customers
SELECT n, 'c' || n || '@example.test', 'US', CURRENT_DATE - (n % 30)
FROM generate_series(1, 40) AS n;

ANALYZE;
