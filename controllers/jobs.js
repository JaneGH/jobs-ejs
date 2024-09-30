const Job = require("../models/Job");

exports.getAllJobs = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id });
  res.render("jobs", { jobs });
};

exports.newJobForm = (req, res) => {
  res.render("job", { job: null });
};

exports.createJob = async (req, res) => {
  const { company, position, status } = req.body;
  await Job.create({ company, position, status, createdBy: req.user._id });
  res.redirect("/jobs");
};

exports.editJobForm = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job || job.createdBy.toString() !== req.user._id.toString()) {
    return res.redirect("/jobs");
  }
  res.render("job", { job });
};

exports.updateJob = async (req, res) => {
  const { company, position, status } = req.body;
  await Job.findByIdAndUpdate(req.params.id, { company, position, status });
  res.redirect("/jobs");
};

exports.deleteJob = async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.redirect("/jobs");
};
