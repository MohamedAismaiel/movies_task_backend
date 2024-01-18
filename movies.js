const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const { v4: uuid } = require("uuid");
require("dotenv").config();
const rateLimit = require("express-rate-limit");
const apicache = require("apicache");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const PORT = process.env.PORT || 4000;

const app = express();

//Rate Limiting
const limiting = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 Mins
  max: 200, //can not excceed 100 request in 5 Mins
  statusCode: 200,
  message: {
    status: 429,
    limiter: true,
    type: "error",
    message: "Too Many Requests, please try again in 10 minutes",
  },
});
//Initialize cache
let cache = apicache.middleware;
//Setting Headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(limiting);
app.set("trust proxy", 1);

const moviesGeneralUrl =
  "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc";

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1MjIyZTViOWIwMDY5NjIyZDUxMjZhNzE1YTA4MmIxMiIsInN1YiI6IjY1YTQ1Mjc5NmY0M2VjMDEzMTQ1YjNjYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.58PbCFbVeqECm2WPU28KYveRVQ5TQ6upXngsXShHnfo",
  },
};

//Routes

app.get("/movies", cache("5 minutes"), async (req, res) => {
  const params = new URLSearchParams({
    page: req.query.page,
  });

  const url = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&${params}`;

  try {
    return fetch(url, options)
      .then((res) => res.json())
      .then((movies) => {
        return res.status(200).json({ movies });
      });
  } catch (err) {
    res.status(500).json(error);
  }
});
app.get("/movies/keyword", cache("5 minutes"), async (req, res) => {
  const params = new URLSearchParams({
    page: req.query.page,
    query: req.query.name,
  });
  let url = `https://api.themoviedb.org/3/search/movie?${params}`;
  try {
    return fetch(req.query.name.length === 0 ? moviesGeneralUrl : url, options)
      .then((res) => res.json())
      .then((movies) => {
        return res.status(200).json({ movies });
      });
  } catch (error) {
    res.status(500).json(error);
  }
});
app.get("/movies/details", cache("5 minutes"), async (req, res) => {
  let url = `https://api.themoviedb.org/3/movie/${req.query.id}?language=en-US`;
  try {
    return fetch(url, options)
      .then((res) => res.json())
      .then((movie) => {
        return res.status(200).json({ movie });
      });
  } catch (err) {
    res.status(500).json(error);
  }
});

app.listen(PORT, () => {});
