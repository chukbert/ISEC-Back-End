const express = require('express');

const router = express.Router();

const db = require('../db/models');


router.get('/', (req, res) => {
  db.Topic.find().lean().exec()
    .then((val) => {
      res.status(200).json({ data: val, success: !!val });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
    });
});

router.get('/:id', (req, res) => {
  db.Topic.findById(req.params.id).lean().exec()
    .then((val) => {
      res.status(200).json({ data: val, success: !!val });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
    });
});

router.post('/new', (req, res) => {
  const { name } = req.body;
  new db.Topic({ name }).save((err, saved) => {
    if (err) { res.status(500).json({ success: false, error: err }); return; }

    res.status(200).json({ success: true, id: saved.id });
  });
});

router.patch('/edit/:id', (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  db.Topic.updateOne({ _id: id }, { name }, (err) => {
    if (err) { res.status(500).json({ success: false, error: err }); return; }

    res.status(200).json({ success: true });
  });
});

router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.Topic.deleteOne({ _id: id }).exec().then(
    () => {
      res.status(200).json({ success: true });
    },
  ).catch((err) => res.status(500).json({ success: false, error: err }));
});

module.exports = router;
