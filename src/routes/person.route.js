const express = require("express");
const router = express.Router();
const controller = require("../controllers/person.controller");
const { verifyAdminOrManager } = require("../middlewares/admin.middleware");

router.post("/", controller.createGuestUser);
router.get("/", controller.getAll);

// Admin/Manager only: get top recorders by recording count
router.get("/top-recorders", verifyAdminOrManager, controller.getTopRecorders);

// Protected routes - chỉ Admin/Manager mới có thể update/delete user
router.put("/:id", verifyAdminOrManager, controller.updateUser);
router.delete("/:id", verifyAdminOrManager, controller.deleteUser);

module.exports = router;
