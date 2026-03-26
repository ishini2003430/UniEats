const express = require('express');
const router = express.Router();
const { 
  addReview, 
  getVendorReviews, 
  updateReview, 
  deleteReview,
  getAllReviews,    // Add this
  getUserReviews    // Add this
} = require('../../src/controllers/reviewController');

router.post('/add', addReview);
router.get('/all', getAllReviews); // New Route
router.get('/user/:email', getUserReviews); // New Route
router.get('/vendor/:vendorId', getVendorReviews);
router.put('/update/:id', updateReview);
router.delete('/delete/:id', deleteReview);

module.exports = router;