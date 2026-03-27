const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userEmail: { 
    type: String, 
    required: true },

  userName: {
     type: String,
      required: true },

  vendorId: {
     type: String, 
     required: true }, // Can be Canteen ID or Meal ID

  mealName: {
    type: String,
    required: true // This will populate the "Meal Name" pill in your UI
  },
  rating: { 
    type: Number,
     required: true, min: 1, max: 5 },

  comment: {
     type: String,
      required: true },

  date: {
     type: Date,
      default: Date.now }
},
 { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);