const mongoose = require('mongoose');

const runnerSchema = new mongoose.Schema({
  name: String,
  bibNumber: String,
  city: String,
  categories: [String],
  startTime: String,
  endTime: String,
  didFinish: Boolean,
  medalReceived: Boolean,
  certificateReceived: Boolean,
  finishTime: Number,
  sponsors: [String],
  categories: [String],
  refreshmentStalls: [String], 

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Runner', runnerSchema);