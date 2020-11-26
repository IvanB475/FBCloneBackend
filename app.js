const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { RateLimiterMongo } = require('rate-limiter-flexible');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });


mongoose.connect('mongodb://localhost:27017/FBClone', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}); 

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("connected to DB");
});

const opts = {
    storeClient: db,
    points: 10,
    duration: 1
};

const rateLimiterMongo = new RateLimiterMongo(opts);

const rateLimiterMiddleware = (req, res, next) => { 
    rateLimiterMongo.consume(req.ip, 2) 
      .then((rateLimiterRes) => {
        console.log(rateLimiterRes);
        next();
      })
      .catch((rateLimiterRes) => {
          console.log("rateLimiter: " + rateLimiterRes);
        res.status(429).send('Too many requests');
      });
    };

app.use(rateLimiterMiddleware);

app.listen(PORT, () => {
    console.log("App started on port " + PORT);
})