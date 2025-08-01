const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors')
const app = express()
const port = 3030;

app.use(cors())
app.use(require('body-parser').urlencoded({ extended: false }));

const reviews_data = JSON.parse(fs.readFileSync("reviews.json", 'utf8'));
const dealerships_data = JSON.parse(fs.readFileSync("dealerships.json", 'utf8'));
const cars_data = JSON.parse(fs.readFileSync("car_records.json", 'utf8'));

mongoose.connect("mongodb://mongo_db:27017/", { 'dbName': 'dealershipsDB' });


const Reviews = require('./review');

const Dealerships = require('./dealership');

const Cars = require('./car');

try {
  Reviews.deleteMany({}).then(() => {
    Reviews.insertMany(reviews_data['reviews']);
  });
  Dealerships.deleteMany({}).then(() => {
    Dealerships.insertMany(dealerships_data['dealerships']);
  });
  Cars.deleteMany({}).then(() => {
    Cars.insertMany(cars_data['cars'].map((car, index) => ({
      ...car,
      id: index + 1,
    })));
  });
} catch (error) {
  res.status(500).json({ error: 'Error fetching documents' });
}


// Express route to home
app.get('/', async (req, res) => {
  res.send("Welcome to the Mongoose API")
});

app.get('/cars', async (req, res) => {
  try {
    const cars = await Cars.find();
    res.json({ status: 200, cars: cars });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cars' });
  }
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({ dealership: req.params.id });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const dealerships = await Dealerships.find();
    res.json({ status: 200, dealers: dealerships });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Error fetching dealers", error: error.message });
  }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const state = req.params.state;
    const dealerships = await Dealerships.find({ state: state });
    res.json({ status: 200, dealers: dealerships });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Error fetching dealers by state", error: error.message });
  }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const dealership = await Dealerships.findOne({ id: id });
    if (!dealership) {
      return res.status(404).json({ status: 404, message: "Dealer not found" });
    }
    res.json({ status: 200, dealer: dealership });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Error fetching dealer by ID", error: error.message });
  }
});

//Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
  data = JSON.parse(req.body);
  const documents = await Reviews.find().sort({ id: -1 })
  let new_id = documents[0]['id'] + 1

  const review = new Reviews({
    "id": new_id,
    "name": data['name'],
    "dealership": data['dealership'],
    "review": data['review'],
    "purchase": data['purchase'],
    "purchase_date": data['purchase_date'],
    "car_make": data['car_make'],
    "car_model": data['car_model'],
    "car_year": data['car_year'],
  });

  try {
    const savedReview = await review.save();
    res.json(savedReview);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error inserting review' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
