const express = require('express');
const touristController = require('../controllers/touristController');
const productController = require('../controllers/productController');
const itineraryController = require('../controllers/itineraryController.js');
const activityController = require('../controllers/activityController.js');
const historicalPlacesController= require('../controllers/historicalPlacesController');

const router = express.Router();

router.get('/', touristController.getTourist);
router.put('/', touristController.updateTourist);
    
router.get('/sort-products-rating', productController.sortProductsByRating);
router.get('/itineraries', itineraryController.getAllItineraries);

router.get('/filter-activities',activityController.filterActivities);
router.get('/activities', activityController.getAllActivities);

router.get('/products', productController.getAllProducts);
router.get('/products/:name', productController.getProductbyName);

router.get('/filter-itinerary',itineraryController.filterItineraries);
router.get('/filter-historical-places',historicalPlacesController.filterHistoricalPlaces);
router.get('/search-historical-places',historicalPlacesController.searchHistoricalPlaces);
router.get('/search-activities',activityController.searchActivities);
router.get('/search-itineraries',itineraryController.searchItineraries);

module.exports = router;