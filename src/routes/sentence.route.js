const express = require("express");
const router = express.Router();

const sentenceController = require("../controllers/sentence.controller");


router.post("/", sentenceController.createSentence);
router.get("/", sentenceController.getAll);
router.put("/:id", sentenceController.updateSentence);

module.exports = router;
