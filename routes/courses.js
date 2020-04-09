const express = require('express');

const router = express.Router();

const db = require('../db/models');

const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  db.Course.find().lean().exec()
    .then((val) => {
      res.status(200).json({ data: val, success: !!val });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
    });
});

router.get('/:id', (req, res) => {
  db.Course.findOne({ _id: req.params.id }).populate('list_topic').lean().exec()
    .then((val) => {
      res.status(200).json({ data: val, success: !!val });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
    });
});

router.post('/new', (req, res) => {
  new db.Course(req.body).save((err, saved) => {
    if (err) { res.status(500).json({ success: false, error: err }); return; }

    res.status(200).json({ success: true, id: saved.id });
  });
});

router.patch('/edit/:id', (req, res) => {
  const { id } = req.params;
  db.Course.updateOne(
    { _id: id }, req.body, (err) => {
      if (err) { res.status(500).json({ success: false, error: err }); return; }

      res.status(200).json({ success: true });
    },
  );
});

router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.Course.deleteOne({ _id: id }).exec().then(
    () => {
      res.status(200).json({ success: true });
    },
  ).catch((err) => res.status(500).json({ success: false, error: err }));
});

router.post('/topic/:id', auth, (req, res) => {
  if (req.id == null) {
    res.status(401).json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.status(500).json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        db.Teacher.findById(req.id, (errTeacher, resultTeacher) => {
          if (errTeacher) {
            res.status(500).json({ success: false, error: errTeacher });
          } else if (!resultTeacher) {
            res.status(401).json({ success: false, error: 'Admin/Teacher not found' });
          } else {
            // add course
            // eslint-disable-next-line object-curly-newline
            // eslint-disable-next-line max-len
            // eslint-disable-next-line object-curly-newline
            new db.Topic(req.body).save((errTopic, savedTopic) => {
              if (errTopic) { res.status(500).json({ success: false, error: errTopic }); }
              db.Course.findByIdAndUpdate(
                req.params.id,
                { $push: { list_topic: savedTopic.id } },
                {
                  useFindAndModify: false,
                  new: true,
                },
                (errCourse) => {
                  if (errCourse) { res.status(500).json({ success: false, error: errCourse }); }
                  res.status(200).json({ success: true });
                },
              );
            });
          }
        });
      } else {
        // add course
        // eslint-disable-next-line object-curly-newline
        new db.Topic(req.body).save((errTopic, savedTopic) => {
          if (errTopic) { res.status(500).json({ success: false, error: errTopic }); }
          db.Course.findByIdAndUpdate(
            req.params.id,
            { $push: { list_topic: savedTopic.id } },
            {
              useFindAndModify: false,
              new: true,
            },
            (errCourse) => {
              if (errCourse) { res.status(500).json({ success: false, error: errCourse }); }
              res.status(200).json({ success: true });
            },
          );
        });
      }
    });
  }
});

module.exports = router;
