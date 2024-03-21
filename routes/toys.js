const express = require("express");
const { auth } = require("../middlewares/auth");
const { ToyModel, validateToy } = require("../models/toyModel");
const router = express.Router();

router.get("/", async (req, res) => {
  const limit = Math.min(req.query.limit, 20) || 10;
  const skip = req.query.skip || 0;
  const sort = req.query.sort || "_id";
  const reverse = req.query.reverse == "yes" ? -1 : 1;

  try {
    const data = await ToyModel.find({})
      .limit(limit)
      .skip(skip)
      .sort({ [sort]: reverse });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.get("/search", async (req, res) => {
  try {
    const searchQ = req.query.s;
    const searchExp = new RegExp(searchQ, "i");
    const data = await ToyModel.find({
      $or: [{ name: searchExp }, { info: searchExp }],
    }).limit(10);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.get("/category/:catName", async (req, res) => {
  const limit = Math.min(req.query.limit, 20) || 10;
  const skip = req.query.skip || 0;
  const sort = req.query.sort || "category";
  const reverse = req.query.reverse == "yes" ? -1 : 1;
  const catName = req.params.catName;
  try {
    const data = await ToyModel.find({ category: catName })
      .limit(limit)
      .skip(skip)
      .sort({ [sort]: reverse });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.get("/single/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await ToyModel.findById(id);
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ err: "Toy is not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.get("/price", async (req, res) => {
  const min = req.query.min || 0;
  const max = req.query.max || Infinity;
  try {
    const data = await ToyModel.find({ price: { $gte: min, $lte: max } }).limit(
      20
    );
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.get("/count", async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const count = await ToyModel.countDocuments({});
    res.json({ count, pages: Math.ceil(count / limit) });
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.post("/", auth, async (req, res) => {
  const validBody = validateToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    const toy = new ToyModel(req.body);
    toy.user_id = req.tokenData._id;
    await toy.save();
    res.status(201).json(toy);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.put("/:id", auth, async (req, res) => {
  const validBody = validateToy(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    const id = req.params.id;
    const data = await ToyModel.updateOne(
      { _id: id, user_id: req.tokenData._id },
      req.body
    );
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const data = await ToyModel.deleteOne({
      _id: id,
      user_id: req.tokenData._id,
    });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

module.exports = router;
