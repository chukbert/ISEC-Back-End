const express = require('express');

const router = express.Router();

const db = require('../db/models');


router.get('/', (req, res) => {
  db.EnrollProgram.find().populate('user_id').lean().exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.get('/:id', (req, res) => {
  db.EnrollProgram.findOne({ _id: req.params.id })
    .lean()
    .exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.post('/new', (req, res) => {
  new db.EnrollProgram(req.body).save((err, saved) => {
    if (err) { res.json({ success: false, error: err }); return; }

    res.json({ success: true, id: saved.id });
  });
});

router.patch('/edit/:id', (req, res) => {
  const { id } = req.params;
  db.EnrollProgram.updateOne(
    { _id: id }, req.body, (err) => {
    if (err) { res.json({ success: false, error: err }); return; }

    res.json({ success: true });
  });
});

router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.EnrollProgram.deleteOne({ _id: id }).exec().then(
    () => {
      res.json({ success: true });
    },
  ).catch((err) => res.json({ success: false, error: err }));
});

module.exports = router;
