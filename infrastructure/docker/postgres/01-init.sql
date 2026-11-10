-- MediNex PostgreSQL Initialization Script
-- Ensures required extensions exist and sets timezone to UTC

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER DATABASE medinex_db SET timezone TO 'UTC';
