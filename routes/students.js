const express = require('express');

const router = express.Router();

const db = require('../db/models');


router.get('/', (req, res) => {
  db.Student.find().lean().exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.get('/:id', (req, res) => {
  db.Student.findOne({ _id: req.params.id })
    .populate('enrollprogram_id')
    .lean()
    .exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.post('/new', (req, res) => {
  new db.Student(req.body).save((err, saved) => {
    if (err) { res.json({ success: false, error: err }); return; }

    res.json({ success: true, id: saved.id });
  });
});

router.patch('/edit/:id', (req, res) => {
  const { id } = req.params;
  db.Student.updateOne(
    { _id: id }, req.body, (err) => {
    if (err) { res.json({ success: false, error: err }); return; }

    res.json({ success: true });
  });
});

module.exports = router;
