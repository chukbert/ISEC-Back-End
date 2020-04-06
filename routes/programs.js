/* eslint-disable object-curly-newline */
/* eslint-disable no-trailing-spaces */
/* eslint-disable max-len */
const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

const db = require('../db/models');


router.get('/', (req, res) => {
  db.Program.find().lean().exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.get('/:id', (req, res) => {
  db.Program.findOne({ _id: req.params.id })
    .populate('list_teacher', 'username')
    .populate('list_course.course_id', 'name')
    .populate('list_course.prerequisite', 'name')
    .lean()
    .exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

router.post('/new', auth, (req, res) => {
  if (req.id == null) {
    res.json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.json({ success: false, error: 'Admin not found' });
      } else {
        new db.Program(req.body).save((err, saved) => {
          if (err) { res.json({ success: false, error: err }); return; }
          db.Admin.update(
            { _id: req.id },
            { $push: { program_id: saved.id } },
          );
          res.json({ success: true, id: saved.id });
        });
      }
    });
  }
});

router.patch('/edit/:id', auth, (req, res) => {
  if (req.id == null) {
    res.json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.json({ success: false, error: 'Admin not found' });
      } else {
        const { id } = req.params;
        db.Program.updateOne(
          { _id: id }, req.body, (err) => {
            if (err) { res.json({ success: false, error: err }); return; }
            res.json({ success: true });
          },
        );
      }
    });
  }
});

router.delete('/delete/:id', auth, (req, res) => {
  if (req.id == null) {
    res.json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.json({ success: false, error: 'Admin not found' });
      } else {
        const { id } = req.params;
        db.Program.deleteOne({ _id: id }).exec().then(
          () => {
            db.Admin.updateOne({ _id: req.id }, { $pull: { program_id: id } }).exec().then(
              () => {
                res.json({ success: true });
              },
            ).catch((err) => res.json({ success: false, error: err }));
          },
        ).catch((err) => res.json({ success: false, error: err }));
      }
    });
  }
});

router.post('/teacher/:id', auth, (req, res) => {
  if (req.id == null) {
    res.json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.json({ success: false, error: 'Admin not found' });
      } else {
        const { id } = req.params;
        db.Program.findById(id, (err, result) => {
          if (err) { res.json({ success: false, error: err }); return; }
          db.Teacher.findOneAndUpdate(
            { username: req.body.username },
            { $pull: { programs: { program_id: result.id } } },
            { upsert: true },
            (errTeacher, resultTeacher) => {
              if (errTeacher) {
                res.json({ success: false, error: errTeacher });
              } else {
                db.Program.updateOne(
                  { _id: id },
                  { $push: { list_teacher: resultTeacher.id } },
                  (errProgram) => {
                    if (err) { res.json({ success: false, error: errProgram }); return; }
                    res.json({ success: true });
                  },
                );
              }
            },
          );
        });
      }
    });
  }
});

router.delete('/teacher/:id', auth, (req, res) => {
  if (req.id == null) {
    res.json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.json({ success: false, error: 'Admin not found' });
      } else {
        const { id } = req.params;
        db.Program.findById(id, (err, result) => {
          if (err) { res.json({ success: false, error: err }); return; }
          db.Teacher.findOneAndUpdate(
            { username: req.body.username },
            { $pull: { programs: { program_id: result.id } } },
            { upsert: true },
            (errTeacher, resultTeacher) => {
              if (errTeacher) {
                res.json({ success: false, error: errTeacher });
              } else {
                db.Program.updateOne(
                  { _id: id },
                  { $pull: { list_teacher: resultTeacher.id } },
                  (errProgram) => {
                    if (err) { res.json({ success: false, error: errProgram }); return; }
                    res.json({ success: true });
                  },
                );
              }
            },
          );
        });
      }
    });
  }
});

router.post('/course/:id', auth, (req, res) => {
  if (req.id == null) {
    res.json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        db.Teacher.findById(req.id, (errTeacher, resultTeacher) => {
          if (errTeacher) {
            res.json({ success: false, error: errTeacher });
          } else if (!resultTeacher) {
            res.json({ success: false, error: 'Admin/Teacher not found' });
          } else {
            // add course
            // eslint-disable-next-line object-curly-newline
            // eslint-disable-next-line max-len
            // eslint-disable-next-line object-curly-newline
            new db.Course({ name: req.body.name,
              code: req.body.code,
              description: req.body.description }).save((errCourse, savedCourse) => {
              if (errCourse) { res.json({ success: false, error: errCourse }); }
              db.Program.findByIdAndUpdate(
                req.params.id,
                { $push: { list_course: { course_id: savedCourse.id } } },
                {
                  useFindAndModify: false,
                  new: true,
                },
                (errProgram) => {
                  if (errProgram) { res.json({ success: false, error: errProgram }); }
                },
              );
            });
          }
        });
      } else {
        // add course
        // eslint-disable-next-line object-curly-newline
        new db.Course({ 
          name: req.body.name,
          code: req.body.code,
          description: req.body.description }).save((errCourse, savedCourse) => {
          if (errCourse) { res.json({ success: false, error: errCourse, type: 'course' }); return; }
          db.Program.findByIdAndUpdate(
            req.params.id,
            { $push: { list_course: { course_id: savedCourse.id } } },
            {
              useFindAndModify: false,
              new: true,
            },
            (errProgram) => {
              if (errProgram) { res.json({ success: false, error: errProgram, type: 'program' }); }
            },
          );
        });
      }
    });
  }
});

module.exports = router;
