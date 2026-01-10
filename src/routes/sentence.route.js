const express = require("express");
const router = express.Router();

const sentenceController = require("../controllers/sentence.controller");
const { verifyAdminOrManager } = require("../middlewares/admin.middleware");

// Chỉ Admin/Manager mới có thể tạo sentence
router.post("/", verifyAdminOrManager, sentenceController.createSentence);
// User có thể tạo sentence không cần token (status = 0)
router.post("/user", sentenceController.createUserSentence);
router.get("/", sentenceController.getAll);
// Get sentences by status (0=user created, 1=admin created, 2=has approved recording, 3=rejected)
router.get("/status/:status", sentenceController.getSentencesByStatus);
router.put("/:id", sentenceController.updateSentence);

// Admin/Manager có thể duyệt hoặc reject sentences của user
router.patch("/:id/approve", verifyAdminOrManager, sentenceController.approveSentence);
router.patch("/:id/reject", verifyAdminOrManager, sentenceController.rejectSentence);

module.exports = router;
