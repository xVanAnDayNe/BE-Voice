const express = require("express");
const router = express.Router();

const sentenceController = require("../controllers/sentence.controller");
const { verifyAdminOrManager } = require("../middlewares/admin.middleware");

router.post("/", verifyAdminOrManager, sentenceController.createSentence);
router.post("/user", sentenceController.createUserSentence);
router.get("/", sentenceController.getAll);
router.get("/status/:status", sentenceController.getSentencesByStatus);
router.put("/:id", sentenceController.updateSentence);
router.patch("/:id/approve", verifyAdminOrManager, sentenceController.approveSentence);
router.patch("/:id/reject", verifyAdminOrManager, sentenceController.rejectSentence);

module.exports = router;
