-- create your database in pgAdmin by following the instructions below --
CREATE DATABASE movies;

-- make sure you are inside the 'movies' query tool
CREATE TABLE mymovies(
	id SERIAL PRIMARY KEY,
	title TEXT NOT NULL,
	rating INT NOT NULL,
	year INT, -- in case the movie wasn't found --
	description TEXT NOT NULL,
	imgurl TEXT -- in case the movie wasn't found --
);

