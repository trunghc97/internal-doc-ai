#!/bin/bash
set -e

# Create database if not exists
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE docai_db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'docai_db')\gexec
    GRANT ALL PRIVILEGES ON DATABASE docai_db TO docai_user;
EOSQL

# Connect to docai_db and create schema if not exists
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "docai_db" <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS public;
    GRANT ALL ON SCHEMA public TO docai_user;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO docai_user;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO docai_user;
EOSQL
