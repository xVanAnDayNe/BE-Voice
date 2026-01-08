const express = require("express");
const router = express.Router();
const controller = require("../controllers/person.controller");


router.post("/", controller.createGuestUser);
router.get("/", controller.getAll); 


module.exports = router;
