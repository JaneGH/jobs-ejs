const express = require("express");
const router = express.Router();
const jobsController = require("../controllers/jobs");

router.get("/", jobsController.getAllJobs);
router.get("/new", jobsController.newJobForm);
router.post("/", jobsController.createJob);
router.get("/edit/:id", jobsController.editJobForm);
router.post("/update/:id", jobsController.updateJob);
router.post("/delete/:id", jobsController.deleteJob);

module.exports = router;
