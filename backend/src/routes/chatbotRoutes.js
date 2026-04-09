const express = require("express");
const router = express.Router();
const chatbot = require("../controllers/chatbotController");

router.post("/", chatbot.handleQuestion);
router.get("/health", chatbot.health);

module.exports = router;
