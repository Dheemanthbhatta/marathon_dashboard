const express = require('express');
const router = express.Router();
const Runner = require('../models/Runner');

// ✅ Helper to parse "HH:MM" into Date
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  now.setHours(hours);
  now.setMinutes(minutes);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now;
};

// ✅ POST route to insert runner with finishTime
router.post('/', async (req, res) => {
  try {
    console.log("📩 Incoming runner data:", req.body);

    const start = parseTime(req.body.startTime);
    const end = parseTime(req.body.endTime);
    const duration = (end - start) / 60000;

    console.log("⏱ Calculated finishTime:", duration);

    const runner = new Runner({
      ...req.body,
      finishTime: duration
    });

    await runner.save();
    console.log("✅ Runner saved:", runner);
    res.status(201).json({ message: 'Runner submitted!' });
  } catch (err) {
    console.error("❌ Error saving runner:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET all runners
router.get('/all', async (req, res) => {
  try {
    const runners = await Runner.find();
    res.json(runners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Runners who did NOT finish
router.get('/did-not-finish', async (req, res) => {
  try {
    const nonFinishers = await Runner.find({ didFinish: false });
    res.json(nonFinishers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Full Marathon finishers
router.get('/full-marathon-finishers', async (req, res) => {
  try {
    const finishers = await Runner.find({
      categories: "Full Marathon",
      didFinish: true
    });
    res.json(finishers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Medal winners
router.get('/medal-winners', async (req, res) => {
  try {
    const winners = await Runner.find({ medalReceived: true });
    res.json(winners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Certificate receivers
router.get('/certificate-receivers', async (req, res) => {
  try {
    const receivers = await Runner.find({ certificateReceived: true });
    res.json(receivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Search by city
router.get('/by-city/:city', async (req, res) => {
  try {
    const city = req.params.city;
    const runners = await Runner.find({ city });
    res.json(runners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Completion rate by city
router.get('/completion-rate-by-city', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      {
        $group: {
          _id: "$city",
          totalRunners: { $sum: 1 },
          finishedRunners: {
            $sum: {
              $cond: [{ $eq: ["$didFinish", true] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          city: "$_id",
          _id: 0,
          totalRunners: 1,
          finishedRunners: 1,
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ["$finishedRunners", "$totalRunners"] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Top 3 cities by completion rate
router.get('/top-completion-cities', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      {
        $group: {
          _id: "$city",
          totalRunners: { $sum: 1 },
          finishedRunners: {
            $sum: {
              $cond: [{ $eq: ["$didFinish", true] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          city: "$_id",
          _id: 0,
          totalRunners: 1,
          finishedRunners: 1,
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ["$finishedRunners", "$totalRunners"] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { completionRate: -1 } },
      { $limit: 3 }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Fastest runner by category
router.get('/fastest-by-category', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      { $match: { didFinish: true, finishTime: { $exists: true } } },
      { $unwind: "$categories" },
      { $sort: { finishTime: 1 } },
      {
        $group: {
          _id: "$categories",
          fastestRunner: { $first: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          name: "$fastestRunner.name",
          city: "$fastestRunner.city",
          finishTime: "$fastestRunner.finishTime"
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Average completion time per category
router.get('/average-time-by-category', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      { $match: { didFinish: true, finishTime: { $exists: true } } },
      { $unwind: "$categories" },
      {
        $group: {
          _id: "$categories",
          averageTime: { $avg: "$finishTime" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          averageTime: { $round: ["$averageTime", 2] }
        }
      },
      { $sort: { averageTime: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Sponsors supporting multiple categories
router.get('/multi-category-sponsors', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      { $unwind: "$sponsors" },
      { $unwind: "$categories" },
      {
        $group: {
          _id: "$sponsors",
          uniqueCategories: { $addToSet: "$categories" }
        }
      },
      {
        $project: {
          sponsor: "$_id",
          categoryCount: { $size: "$uniqueCategories" },
          categories: "$uniqueCategories"
        }
      },
      { $match: { categoryCount: { $gt: 1 } } },
      { $sort: { categoryCount: -1 } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Runners in multiple categories (aggregation fix)
router.get('/multi-category-runners', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      {
        $match: {
          $expr: { $gt: [{ $size: "$categories" }, 1] }
        }
      }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Top 3 finishers in Half Marathon
router.get('/top-3-half-marathon', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      { $match: { didFinish: true, finishTime: { $exists: true } } },
      { $unwind: "$categories" },
      { $match: { categories: "Half Marathon" } },
      { $sort: { finishTime: 1 } },
      { $limit: 3 },
      {
        $project: {
          _id: 0,
          name: 1,
          bibNumber: 1,
          city: 1,
          finishTime: 1
        }
      }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/popular-stalls', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      { $unwind: "$refreshmentStalls" },
      {
        $group: {
          _id: "$refreshmentStalls",
          runnerCount: { $sum: 1 }
        }
      },
      { $match: { runnerCount: { $gt: 50 } } },
      {
        $project: {
          _id: 0,
          stall: "$_id",
          runnerCount: 1
        }
      },
      { $sort: { runnerCount: -1 } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Popular Categories Route
router.get('/popular-categories', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $match: { count: { $gt: 200 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/better-than-average', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      { $match: { didFinish: true, finishTime: { $exists: true } } },
      { $unwind: "$categories" },
      {
        $group: {
          _id: "$categories",
          avgTime: { $avg: "$finishTime" }
        }
      },
      {
        $lookup: {
          from: "runners",
          let: { category: "$_id", avg: "$avgTime" },
          pipeline: [
            { $match: { didFinish: true, finishTime: { $exists: true } } },
            { $unwind: "$categories" },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$categories", "$$category"] },
                    { $lt: ["$finishTime", "$$avg"] }
                  ]
                }
              }
            },
            {
              $project: {
                _id: 0,
                name: 1,
                bibNumber: 1,
                city: 1,
                category: "$categories",
                finishTime: 1
              }
            }
          ],
          as: "betterRunners"
        }
      },
      { $unwind: "$betterRunners" },
      { $replaceRoot: { newRoot: "$betterRunners" } },
      { $sort: { category: 1, finishTime: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error("❌ Error in /better-than-average:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get('/top-participation-cities', async (req, res) => {
  try {
    const result = await Runner.aggregate([
      {
        $group: {
          _id: "$city",
          participantCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          city: "$_id",
          participantCount: 1
        }
      },
      { $sort: { participantCount: -1 } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
