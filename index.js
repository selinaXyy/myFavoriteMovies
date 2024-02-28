import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const db = new pg.Client({
    user:"postgres", //substitude to your PostgreSQL username
    password:"123456", //substitude to your PostgreSQL password
    host:"localhost", //this program is hosted on localhost port 3000
    database:"movies", //after this command, go to 'database.sql' file for setting up your database
    port: 5432 //substitude to your PostgreSQL port number
})
db.connect();

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

//get the movies in the database
async function getMoviesbyRating() {
    const result = await db.query("SELECT * FROM mymovies ORDER BY rating DESC"); //returns data sorted by rating
    const movies = result.rows;

    return movies;
}

async function getMoviesbyRecency() {
    const result = await db.query("SELECT * FROM mymovies ORDER BY id DESC"); //returns data sorted by id
    const movies = result.rows;

    return movies;
}

//GET request
app.get("/", async (req, res) => {
    try {
        const movies = await getMoviesbyRating();

        if (movies.length > 0) {
            res.render("index.ejs", {
                movies: movies,
            });
        } else {
            res.render("index.ejs", {
                mainHeading: "Create your first review here!",
            });
        }
    } 
    catch (error) {
        console.error("Error fetching movies:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/add",(req,res)=>{
    res.render("addNew.ejs");
});

//POST request
app.post("/",async (req,res)=>{
    const movieTitle = req.body.title;
    const movieRating = req.body.rating;
    const reviewContent = req.body.content;

    const apiRequest = `https://omdbapi.com/?t=${movieTitle.trim()}&apikey=7df73dfc`;

    //connect API
    try{
        const movieDetails = await axios.get(apiRequest);

        const year = movieDetails.data.Year;
        const imgURL = movieDetails.data.Poster;

        //add data to database
        if (year && imgURL){
            await db.query("INSERT INTO mymovies (title, rating, year, description, imgurl) VALUES ($1, $2, $3, $4, $5)"
            ,[movieTitle, movieRating, year, reviewContent, imgURL]);
        }
        else{
            await db.query("INSERT INTO mymovies (title, rating, description) VALUES ($1, $2, $3)"
            ,[movieTitle, movieRating, reviewContent]);
        }

        res.redirect("/");
    }
    catch(err){
        console.log(err);
        res.status(500).send("API Request Error");
    }
    
});

app.post("/sort", async (req,res)=>{
    const sortChoice = req.body.selectSort;

    //if user chose to sort by recency
    if (sortChoice === "sortByRecency"){
        const movies = await getMoviesbyRecency();

        res.render("index.ejs",{
            movies: movies,
        });
    }
    else{
        //if user chose to sort by rating
        const movies = await getMoviesbyRating();

        res.render("index.ejs",{
            movies: movies,
        });
    }
});

app.post("/edit", async (req,res)=>{
    const editMovieId = req.body.movieId;

    try{
        const editMovieTitle = await db.query("SELECT title FROM mymovies WHERE id=$1",[editMovieId]);
        const editMovieRating = await db.query("SELECT rating FROM mymovies WHERE id=$1",[editMovieId]);
        const editMovieReview = await db.query("SELECT description FROM mymovies WHERE id=$1",[editMovieId]);

        res.render("edit.ejs",{
            movieId: editMovieId,
            movieTitle: editMovieTitle.rows[0].title,
            movieRating: editMovieRating.rows[0].rating,
            movieReview: editMovieReview.rows[0].description,
        });
    }
    catch(err){
        console.log(err);
        res.status(500).send("Database Query Error");
    }
});

app.post("/update", async (req,res)=>{
    const updateMovieId = req.body.movieId;
    const updatedRating = req.body.rating;
    const updatedContent = req.body.content;

    try{

        await db.query("UPDATE mymovies SET rating=$1, description=$2 WHERE id=$3"
        ,[updatedRating, updatedContent, updateMovieId]);

        res.redirect("/");
    }
    catch(err){
        console.log(err);
        res.status(500).send("Database Query Error");
    }
});

app.post("/delete", async (req,res)=>{
    const deleteMovieId = req.body.movieId;

    try{
        await db.query("DELETE FROM mymovies WHERE id=$1",[deleteMovieId]); //delete the corresponding data from db

        res.redirect("/");
    }
    catch(err){
        console.log(err);
    }
});

app.listen(port,()=>{
    console.log(`Port ${port} successfully started.`);
});
