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
      res.status(200).json({ data: val, success: !!val });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
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
      res.status(200).json({ data: val, success: !!val });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
    });
});

router.post('/new', auth, (req, res) => {
  if (req.id == null) {
    res.status(401).json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.status(500).json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.status(404).json({ success: false, error: 'Admin not found' });
      } else {
        new db.Program(req.body).save((err, saved) => { 
          if (err) { res.status(500).json({ success: false, error: err }); return; }
          db.Admin.findByIdAndUpdate(
            req.id,
            { $push: { program_id: saved.id } },
            {
              useFindAndModify: false,
              new: true,
            },
            (errAdminProgram) => {
              if (errAdminProgram) { res.status(500).json({ success: false, error: errAdminProgram }); return; }
              res.status(200).json({ success: true, id: saved.id });
            },
          ); 
        });
      }
    });
  }
});

router.patch('/edit/:id', auth, (req, res) => {
  if (req.id == null) {
    res.status(401).json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.status(500).json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.status(404).json({ success: false, error: 'Admin not found' });
      } else {
        const { id } = req.params;
        db.Program.findByIdAndUpdate(
          id, req.body, (err) => {
            if (err) { res.status(500).json({ success: false, error: err }); return; }
            res.status(200).json({ success: true });
          },
        );
      }
    });
  }
});

router.delete('/delete/:id', auth, (req, res) => {
  if (req.id == null) {
    res.status(401).json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.status(500).json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.status(404).json({ success: false, error: 'Admin not found' });
      } else {
        const { id } = req.params;
        db.Program.deleteOne({ _id: id }).exec().then(
          () => {
            db.Admin.findByIdAndUpdate(req.id, { $pull: { program_id: id } }).exec().then(
              () => {
                res.status(200).json({ success: true });
              },
            ).catch((err) => res.status(500).json({ success: false, error: err }));
          },
        ).catch((err) => res.status(500).json({ success: false, error: err }));
      }
    });
  }
});

router.post('/teacher/:id', auth, (req, res) => {
  if (req.id == null) {
    res.status(401).json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.status(500).json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.status(404).json({ success: false, error: 'Admin not found' });
      } else {
        const { id } = req.params;
        db.Program.findById(id, (err, result) => {
          if (err) { res.status(500).json({ success: false, error: err }); return; }
          db.Teacher.findOneAndUpdate(
            { username: req.body.username },
            { $push: { programs: { program_id: result.id } } },
            { upsert: true },
            (errTeacher, resultTeacher) => {
              if (errTeacher) {
                res.status(500).json({ success: false, error: errTeacher });
              } else {
                db.Program.findOneAndUpdate(
                  { _id: id },
                  { $push: { list_teacher: resultTeacher.id } },
                  (errProgram) => {
                    if (err) { res.status(500).json({ success: false, error: errProgram }); return; }
                    res.status(200).json({ success: true });
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
    res.status(401).json({ success: false, error: 'Need Authentication Header' });
  } else {
    db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
      if (errAdmin) {
        res.status(500).json({ success: false, error: errAdmin });
      } else if (!resultAdmin) {
        res.status(404).json({ success: false, error: 'Admin not found' });
      } else {
        const { id } = req.params;
        db.Program.findById(id, (err, result) => {
          if (err) { res.status(500).json({ success: false, error: err }); return; }
          db.Teacher.findOneAndUpdate(
            { username: req.body.username },
            { $pull: { programs: { program_id: result.id } } },
            { upsert: true },
            (errTeacher, resultTeacher) => {
              if (errTeacher) {
                res.status(500).json({ success: false, error: errTeacher });
              } else {
                db.Program.findByIdAndUpdate(
                  id,
                  { $pull: { list_teacher: resultTeacher.id } },
                  (errProgram) => {
                    if (err) { res.status(500).json({ success: false, error: errProgram }); return; }
                    res.status(200).json({ success: true });
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
            res.status(404).json({ success: false, error: 'Admin/Teacher not found' });
          } else {
            // add course
            // eslint-disable-next-line object-curly-newline
            // eslint-disable-next-line max-len
            // eslint-disable-next-line object-curly-newline
            new db.Course({ name: req.body.name,
              code: req.body.code,
              description: req.body.description }).save((errCourse, savedCourse) => {
              if (errCourse) { res.status(500).json({ success: false, error: errCourse }); }
              
              // eslint-disable-next-line prefer-const
              db.Program.findByIdAndUpdate(
                req.params.id,
                { $push: { list_course: { course_id: savedCourse.id } } },
                {
                  useFindAndModify: false,
                  new: true,
                },
                (errProgram) => {
                  if (errProgram) { res.status(500).json({ success: false, error: errProgram, type: 'program' }); return; }
                  
                  if (req.body.prerequisite) {
                    for (let i = 0; i < req.body.prerequisite.length; i += 1) {
                      db.Course.findOne({ code: req.body.prerequisite[i] }, (errCourseCode, resultCode) => {
                        if (errCourseCode) return;
                        if (!resultCode) return;
                        db.Program.findOneAndUpdate({ 
                          _id: req.params.id,
                          'list_course.course_id': savedCourse.id,
                        }, {
                          $push: { 'list_course.$.prerequisite': resultCode.id },
                        }, {
                          useFindAndModify: false,
                          new: true,
                        },
                        () => {});
                      });
                    }
                  }
                  res.status(200).json({ success: true });
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
          if (errCourse) { res.status(500).json({ success: false, error: errCourse, type: 'course' }); return; }
          
          db.Program.findByIdAndUpdate(
            req.params.id,
            { $push: { list_course: { course_id: savedCourse.id } } },
            {
              useFindAndModify: false,
              new: true,
            },
            (errProgram) => {
              if (errProgram) { res.status(500).json({ success: false, error: errProgram, type: 'program' }); return; }
              
              if (req.body.prerequisite) {
                for (let i = 0; i < req.body.prerequisite.length; i += 1) {
                  db.Course.findOne({ code: req.body.prerequisite[i] }, (errCourseCode, resultCode) => {
                    if (errCourseCode) return;
                    if (!resultCode) return;
                    db.Program.findOneAndUpdate({ 
                      _id: req.params.id,
                      'list_course.course_id': savedCourse.id,
                    }, {
                      $push: { 'list_course.$.prerequisite': resultCode.id },
                    }, {
                      useFindAndModify: false,
                      new: true,
                    },
                    () => {});
                  });
                }
              }
              res.status(200).json({ success: true });
            },
          );
        });
      }
    });
  }
});

router.patch('/setprereq/:id', auth, (req, res) => {
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
            res.status(404).json({ success: false, error: 'Admin/Teacher not found' });
          } else {
            // edit course
            db.Course.findOne({ code: req.body.course }, (errCourse, resCourse) => {
              if (errCourse) { res.status(500).json({ success: false, nb: 'code course not found' }); return; }
              db.Program.findOneAndUpdate({ 
                _id: req.params.id,
                'list_course.course_id': resCourse.id,
              }, {
                $set: { 'list_course.$.prerequisite': [] },
              }, {
                useFindAndModify: false,
                new: true,
              },
              (errProgram, resProgram) => {
                if (errProgram) { res.status(500).json({ success: false, error: errProgram }); return; }
                if (req.body.prerequisite) {
                  for (let i = 0; i < req.body.prerequisite.length; i += 1) {
                    db.Course.findOne({ code: req.body.prerequisite[i] }, (errCourseCode, resultCode) => {
                      if (errCourseCode) return;
                      db.Program.findOneAndUpdate({ 
                        _id: resProgram.id,
                        'list_course.course_id': resCourse.id,
                      }, {
                        $push: { 'list_course.$.prerequisite': resultCode.id },
                      }, {
                        useFindAndModify: false,
                        new: true,
                      },
                      () => {});
                    });
                  }
                }
                res.status(200).json({ success: true, note: 'prerequisites updated' });
              });
            });
          }
        });
      } else {
        // edit prereq course
        // eslint-disable-next-line object-curly-newline
        db.Course.findOne({ code: req.body.course }, (errCourse, resCourse) => {
          if (errCourse) { res.status(500).json({ success: false, nb: 'code course not found' }); return; }
          db.Program.findOneAndUpdate({ 
            _id: req.params.id,
            'list_course.course_id': resCourse.id,
          }, {
            $set: { 'list_course.$.prerequisite': [] },
          }, {
            useFindAndModify: false,
            new: true,
          },
          (errProgram, resProgram) => {
            if (errProgram) { res.status(500).json({ success: false, error: errProgram }); return; }
            if (req.body.prerequisite) {
              for (let i = 0; i < req.body.prerequisite.length; i += 1) {
                db.Course.findOne({ code: req.body.prerequisite[i] }, (errCourseCode, resultCode) => {
                  if (errCourseCode) return;
                  db.Program.findOneAndUpdate({ 
                    _id: resProgram.id,
                    'list_course.course_id': resCourse.id,
                  }, {
                    $push: { 'list_course.$.prerequisite': resultCode.id },
                  }, {
                    useFindAndModify: false,
                    new: true,
                  },
                  () => {});
                });
              }
            }
            res.status(200).json({ success: true, note: 'prerequisites updated' });
          });
        });
      }
    });
  }
});

module.exports = router;
