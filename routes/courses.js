const express = require('express');

const router = express.Router();

const db = require('../db/models');


router.get('/', (req, res) => {
  db.Course.find().lean().exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.get('/:id', (req, res) => {
  db.Course.findOne({ _id :req.params.id }).populate('list_topic').lean().exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.post('/new', (req, res) => {
  
  new db.Course({ list_topic : req.body.list_topic,  name : req.body.name,  code : req.body.code , description : req.body.description }).save((err, saved) => {
    if (err) { res.json({ success: false, error: err }); return; }
    
    res.json({ success: true, id: saved.id });
  });
});

router.patch('/edit/:id', (req, res) => {
  const { id } = req.params;
  db.Course.updateOne({ id: id, 
    name: req.body.name, 
    code: req.body.code, 
    description: req.body.description, 
    list_topic: req.body.list_topic  }, (err) => {
      if (err) { res.json({ success: false, error: err }); return; }

      res.json({ success: true });
  });
});

router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.Course.deleteOne({ _id: id }).exec().then(
    () => {
      res.json({ success: true });
    },
  ).catch((err) => res.json({ success: false, error: err }));
});

module.exports = router;
