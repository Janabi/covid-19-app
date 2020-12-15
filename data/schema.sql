DROP TABLE IF EXISTS favorite;

CREATE TABLE IF NOT EXISTS favorite(
    id SERIAL PRIMARY KEY,
    country VARCHAR(255),
    totalConfirmed VARCHAR(255),
    totalRecovered VARCHAR(255),
    totalDeaths VARCHAR(255),
    currentDate VARCHAR(255)
);