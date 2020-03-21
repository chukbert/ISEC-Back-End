const express = require('express');

const router = express.Router();

const db = require('../db/models');


router.get('/', (req, res) => {
  db.Topic.find().lean().exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.get('/:id', (req, res) => {
  db.Topic.findById(req.params.id).lean().exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.post('/new', (req, res) => {
  const { name } = req.body;
  console.log(name);
  new db.Topic({ name }).save((err, saved) => {
    if (err) { res.json({ success: false, error: err }); return; }

    res.json({ success: true, id: saved.id });
  });
});

router.patch('/edit/:id', (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  db.Topic.updateOne({ _id: id }, { name }, (err) => {
    if (err) { res.json({ success: false, error: err }); return; }

    res.json({ success: true });
  });
});

router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.Topic.deleteOne({ _id: id }).exec().then(
    () => {
      res.json({ success: true });
    },
  ).catch((err) => res.json({ success: false, error: err }));
});

module.exports = router;
