const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

const db = require('../db/models');

// status course :
// -1 = belum boleh enroll
// 0 = belum enroll ()
// 1 = sedang mengerjakan
// 2 = sudah selesai

// status program :
// 0 = belum enroll
// 1 = sedang mengerjakan
// 2 = sudah selesai

// status topic :
// 0 = belum mulai
// 1 = in progress
// 2 = selesai

router.get('/', auth, (req, res) => {
  db.EnrollProgram.find({ user_id: req.id }).lean().exec()
    .then((val) => {
      res.status(200).json({ data: val, success: !!val });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
    });
});

router.get('/:id', auth, (req, res) => {
  db.EnrollProgram.findOne({ program_id: req.params.id, user_id: req.id })
    .populate('courses.course_id')
    .populate('program_id')
    .populate({
      path: 'program_id',
      populate: {
        path: 'list_teacher',
        model: 'Teacher',
        select: 'username',
      },
    })
    .populate('courses.prerequisite')
    .lean()
    .exec()
    .then((val) => {
      res.status(200).json({ data: val, success: !!val });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
    });
});

router.get('/:id/courses/:courseid', auth, (req, res) => {
  db.EnrollProgram.findOne({ program_id: req.params.id, user_id: req.id })
    .populate('courses.course_id')
    .populate('courses.topics.topic_id')
    .lean()
    .exec()
    .then((val) => {
      let i = 0;
      while (i < val.courses.length) {
        // eslint-disable-next-line no-underscore-dangle
        if (val.courses[i].course_id._id.toString() === req.params.courseid.toString()) {
          res.status(200).json({ data: val.courses[i], success: !!val });
          return;
        }
        i += 1;
      }
      res.status(404).json({ error: 'Course not found', success: false });
    }, (err) => {
      res.status(500).json({ success: false, error: err });
    });
});

// POST /enrollprograms/new/:id
// :id itu id_program
router.post('/new/:id', auth, (req, res) => {
  db.Program.findById(req.params.id).populate('list_course.course_id').exec((errProgram, resultProgram) => {
    if (errProgram) {
      res.status(500).json({ success: false, error: errProgram });
    } else if (!resultProgram) {
      res.status(404).json({ success: false, error: 'Program not found' });
    } else {
      new db.EnrollProgram({
        program_id: resultProgram.id,
        user_id: req.id,
        status_program: 1,
      }).save((err, saved) => {
        if (err) { res.status(500).json({ success: false, error: err }); return; }
        // console.log(resultProgram);
        for (let i = 0; i < resultProgram.list_course.length; i += 1) {
          let len = resultProgram.list_course[i].prerequisite.length;
          if (len !== 0) {
            len = -1;
          }
          db.EnrollProgram.findByIdAndUpdate(
            saved.id,
            {
              $push: {
                courses: {
                  course_id: resultProgram.list_course[i].course_id.id,
                  prerequisite: resultProgram.list_course[i].prerequisite,
                  status_course: len,
                },
              },
            },
            {
              useFindAndModify: false,
              new: true,
            },
            (errUpdate) => {
              if (errUpdate) { res.status(500).json({ success: false, error: errUpdate }); return; }
              const sizeListCourse = resultProgram.list_course[i].course_id.list_topic.length;
              for (let j = 0; j < sizeListCourse; j += 1) {
                db.EnrollProgram.findOneAndUpdate(
                  {
                    _id: saved.id,
                    'courses.course_id': resultProgram.list_course[i].course_id.id,
                  },
                  {
                    $push: {
                      'courses.$.topics': {
                        topic_id: resultProgram.list_course[i].course_id.list_topic[j],
                        status_topic: 0,
                      },
                    },
                  },
                  { useFindAndModify: false },
                  (errUpdateEnrollCourse) => {
                    if (errUpdateEnrollCourse) {
                      res.status(500).json({ success: false, error: errUpdateEnrollCourse });
                    }
                  },
                );
              }
            },
          );
        }
        db.Student.findByIdAndUpdate(
          saved.user_id,
          { $push: { enrollprogram_id: saved.id } },
          { useFindAndModify: false },
          (errStudentFind) => {
            if (errStudentFind) {
              res.status(500).json({ success: false, error: errStudentFind });
              return;
            }
            res.status(200).json({ success: true, id: saved.id, user_id: saved.user_id });
          },
        );
      });
    }
  });
});

// Buat enroll course, (status course 0 -> 1)
// PATCH enrollprograms/enroll/:program_id/
// body : course_id
router.patch('/enroll/:program_id/', auth, (req, res) => {
  const programId = req.params.program_id;
  const userId = req.id;
  const courseId = req.body.course_id;

  db.Student.findOne({ _id: userId }, (errFindStudentForEnroll, student) => {
    if (errFindStudentForEnroll) return;

    db.EnrollProgram.findOneAndUpdate(
      {
        user_id: student.id,
        program_id: programId,
        'courses.course_id': courseId,
      },
      { $set: { 'courses.$.status_course': 1, 'courses.$.topics.$[].status_topic': 0 } },
      (errEnrollCourse) => {
        if (errEnrollCourse) { res.status(500).json({ success: false, error: errEnrollCourse }); }
        res.status(200).json({ success: true });
      },
    );
  });
});

// Buat fail course, (status course -> -2), must be teacher or admin
// PATCH enrollprograms/fail/:program_id/
// body : course_id, student_id
router.patch('/fail/:program_id/', auth, (req, res) => {
  const programId = req.params.program_id;
  const studentId = req.body.student_id;
  const courseId = req.body.course_id;

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
          db.Student.findOne({ _id: studentId }, (errFindStudentForEnroll, student) => {
            if (errFindStudentForEnroll) return;
            db.EnrollProgram.findOneAndUpdate(
              {
                user_id: student.id,
                program_id: programId,
                'courses.course_id': courseId,
              },
              { $set: { 'courses.$.status_course': -2 } },
              (errEnrollCourse) => {
                if (errEnrollCourse) {
                  res.status(500).json({ success: false, error: errEnrollCourse });
                  return;
                }
                res.status(200).json({ success: true });
              },
            );
          });
        }
      });
    } else {
      db.Student.findOne({ _id: studentId }, (errFindStudentForEnroll, student) => {
        if (errFindStudentForEnroll) return;
        db.EnrollProgram.findOneAndUpdate(
          {
            user_id: student.id,
            program_id: programId,
            'courses.course_id': courseId,
          },
          { $set: { 'courses.$.status_course': -2 } },
          (errEnrollCourse) => {
            if (errEnrollCourse) {
              res.status(500).json({ success: false, error: errEnrollCourse });
              return;
            }
            res.status(200).json({ success: true });
          },
        );
      });
    }
  });
});

// Buat start topic, (status topic 0 -> 1)
// PATCH enrollprograms/start_topic/:program_id/
// body : course_id, topic_id
router.patch('/start_topic/:program_id/', auth, (req, res) => {
  // let program_id = req.params.program_id;
  const studentId = req.id;
  const courseId = req.body.course_id;
  const topicId = req.body.topic_id;

  db.EnrollProgram.findOneAndUpdate(
    { user_id: studentId },
    { $set: { 'courses.$[outer].topics.$[inner].status_topic': 1 } },
    { arrayFilters: [{ 'outer.course_id': courseId }, { 'inner.topic_id': topicId }] },
    (errStartTopic) => {
      if (errStartTopic) { res.status(500).json({ success: false, error: errStartTopic }); return; }
      res.status(200).json({ success: true });
    },
  );
});

// Buat finish topic(1->2) kalau semua topic finish, update status course (1 -> 2)
// Kalau prereq course terpenuhi, update status course (-1 -> 0)
// PATCH enrollprograms/finish/:program_id/
// body : topic_id, course_id
router.patch('/finish/:program_id/', auth, (req, res) => {
  const programId = req.params.program_id;

  db.Student.findOne({ _id: req.id }, (errStudent, student) => {
    if (errStudent) { res.status(500).json({ success: false, error: errStudent }); return; }
    if (!student) { res.status(404).json({ success: false, error: 'No Student' }); return; }
    db.Topic.findOne({ _id: req.body.topic_id }, (errTopic, topic) => {
      if (errTopic) { res.status(500).json({ success: false, error: errTopic }); return; }
      if (!topic) { res.status(404).json({ success: false, error: 'No Topic' }); return; }
      db.Course.findOne({ _id: req.body.course_id }, (errCourse, course) => {
        if (errCourse) { res.status(500).json({ success: false, error: errCourse }); return; }
        if (!course) { res.status(404).json({ success: false, error: 'No Course' }); return; }
        db.EnrollProgram.findOneAndUpdate(
          { user_id: student.id },
          { $set: { 'courses.$[outer].topics.$[inner].status_topic': 2 } },
          { arrayFilters: [{ 'outer.course_id': course.id }, { 'inner.topic_id': topic.id }] },
          (errEnroll) => {
            if (errEnroll) { res.status(500).json({ success: false, error: errEnroll }); return; }

            db.EnrollProgram.findOne(
              {
                user_id: student.id,
                program_id: programId,
              },
              (err, enroll) => {
                if (err) return;
                let finished = true;
                for (let i = 0; i < enroll.courses.length; i += 1) {
                  if (enroll.courses[i].course_id.toString() === course.id.toString()) {
                    let j = 0;
                    while (j < enroll.courses[i].topics.length && finished) {
                      if (enroll.courses[i].topics[j].status_topic !== 2) {
                        finished = false;
                      }
                      j += 1;
                    }
                  }
                }


                if (finished) {
                  db.EnrollProgram.findOneAndUpdate(
                    {
                      user_id: student.id,
                      program_id: programId,
                      'courses.course_id': course.id,
                    },
                    { 'courses.$.status_course': 2 },
                    {
                      useFindAndModify: false,
                      new: true,
                    },
                  )
                    .populate('program_id')
                    .populate('program_id.list_course.course_id').exec(
                      (errFinishCourse, resultEnroll) => {
                        if (errFinishCourse) return;
                        // Buat update kalo program sudah selesai (semua status_course = 2 )
                        let programFinish = true;
                        for (let i = 0; i < resultEnroll.courses.length; i += 1) {
                          if (resultEnroll.courses[i].status_course !== 2) {
                            programFinish = false;
                          }
                        }
                        if (programFinish) {
                          db.EnrollProgram.findOneAndUpdate(
                            {
                              user_id: student.id,
                              program_id: programId,
                            },
                            { $set: { status_program: 2 } },
                            {
                              useFindAndModify: false,
                              new: true,
                            },
                            (errUpdateProgram) => {
                              if (errUpdateProgram) {
                                res.status(500).json({ success: false, error: errUpdateProgram });
                              }
                            },
                          );
                        }
                        // Buat update course jika prereqnya finish (-1 -> 0)
                        for (let i = 0; i < resultEnroll.courses.length; i += 1) {
                          if (resultEnroll.courses[i].status_course === -1) {
                            const sizeProgramLC = resultEnroll.program_id.list_course.length;
                            for (let j = 0; j < sizeProgramLC; j += 1) {
                              let courseIdLC = resultEnroll.program_id.list_course[j].course_id;
                              courseIdLC = courseIdLC.toString();
                              let courseIdEnrollCourse = resultEnroll.courses[i].course_id;
                              courseIdEnrollCourse = courseIdEnrollCourse.toString();
                              if (courseIdLC === courseIdEnrollCourse) {
                                let finishedCourse = true;
                                let k = 0;
                                let sizePre = resultEnroll.program_id.list_course[j].prerequisite;
                                sizePre = sizePre.length;
                                if (sizePre !== null) {
                                  while (k < sizePre) {
                                    let idx;
                                    idx = resultEnroll.program_id.list_course[j].prerequisite[k];
                                    idx = idx.toString();
                                    for (let l = 0; l < resultEnroll.courses.length; l += 1) {
                                      if (resultEnroll.courses[l].course_id.toString() === idx) {
                                        if (resultEnroll.courses[l].status_course !== 2) {
                                          finishedCourse = false;
                                        }
                                      }
                                    }
                                    k += 1;
                                  }
                                }
                                if (finishedCourse) {
                                  db.EnrollProgram.findOneAndUpdate(
                                    {
                                      user_id: student.id,
                                      program_id: programId,
                                      'courses.course_id': resultEnroll.courses[i].course_id.toString(),
                                    },
                                    { $set: { 'courses.$.status_course': 0 } },
                                    {
                                      useFindAndModify: false,
                                      new: true,
                                    },
                                    (errUpdateCourse) => {
                                      if (errUpdateCourse) {
                                        res.status(500).json({
                                          success: false,
                                          error: errUpdateCourse,
                                        });
                                      }
                                    },
                                  );
                                }
                              }
                            }
                          }
                        }
                      },
                    );
                }
              },
            );
          },
        );
        res.status(200).json({ success: true, status_topic: 2 });
      });
    });
  });
});


router.delete('/delete/:id', auth, (req, res) => {
  const { id } = req.params;
  db.EnrollProgram.findOneAndDelete({ program_id: id, user_id: req.id }).exec().then(
    (result) => {
      db.Student.findByIdAndUpdate(
        req.id,
        { $pull: { enrollprogram_id: result.id } },
        { useFindAndModify: false },
        (errStudentFind) => {
          if (errStudentFind) {
            res.status(500).json({ success: false, error: errStudentFind });
            return;
          }
          res.status(200).json({ success: true, deleted: result.id });
        },
      );
    },
  ).catch((err) => res.status(500).json({ success: false, error: err }));
});

module.exports = router;
