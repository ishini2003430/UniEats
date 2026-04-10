const Review = require('../../src/models/Review');

// Create - Add Rating
exports.addReview = async (req, res) => {
  try {
    const newReview = new Review(req.body);
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Read - Get all reviews for a specific vendor
exports.getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    // This finds the reviews where vendorId matches the string ID passed from frontend
    const reviews = await Review.find({ vendorId: vendorId }).sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update - Edit Review
exports.updateReview = async (req, res) => {
  try {
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true }
    );
    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete - Remove Review
exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get ALL reviews (for the "All Reviews" tab)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get reviews by User Email (for the "My Reviews" tab)
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userEmail: req.params.email }).sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};