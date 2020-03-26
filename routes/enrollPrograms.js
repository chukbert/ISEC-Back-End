const express = require('express');
// const auth = require('../middleware/auth');
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
    .populate('user_id')
    .populate('courses.course_id')
    .lean()
    .exec()
    .then((val) => {
      res.json({ data: val, success: !!val });
    }, (err) => {
      res.json({ success: false, error: err });
    });
});
// POST /enrollprograms/new/:id
// :id itu id_program
// body : user_id
router.post('/new/:id', (req, res) => {
  db.Program.findById(req.params.id).populate('list_course.course_id').exec((errProgram, resultProgram) => {
    if (errProgram) {
      res.json({ success: false, error: errProgram });
    } else if (!resultProgram) {
      res.json({ success: false, error: 'Program not found' });
    } else {
      new db.EnrollProgram({
        program_id: resultProgram.id,
        user_id: req.body.user_id,
        status_program: 0,
      }).save((err, saved) => {
        if (err) { res.json({ success: false, error: err }); return; }
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
              if (errUpdate) { res.json({ success: false, error: errUpdate }); return; }
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
                      res.json({ success: false, error: errUpdateEnrollCourse });
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
            if (errStudentFind) { res.json({ success: false, error: errStudentFind }); return; }

            res.json({ success: true, id: saved.id, user_id: saved.user_id });
          },
        );
      });
    }
  });
});

// Buat start pertama kali program, (status program 0 -> 1)
// PATCH enrollprograms/start/:program_id
// body : user_id
router.patch('/start/:program_id/', (req, res) => {
  const programid = req.params.program_id;
  const username = req.body.user_id;

  db.Student.findOne({ _id: username }, (errFindStudent, student) => {
    if (errFindStudent) return;

    db.EnrollProgram.findOneAndUpdate(
      {
        user_id: student.id,
        program_id: programid,
      },
      { $set: { status_program: 1 } },
      (errUpdateStatusProgram) => {
        if (errUpdateStatusProgram) {
          res.json({ success: false, error: errUpdateStatusProgram }); return;
        }

        res.json({ success: true });
      },
    );
  });
});

// Buat enroll course, (status course 0 -> 1)
// PATCH enrollprograms/enroll/:program_id/
// body : user_id, course_id
router.patch('/enroll/:program_id/', (req, res) => {
  const programId = req.params.program_id;
  const userId = req.body.user_id;
  const courseId = req.body.course_id;

  db.Student.findOne({ _id: userId }, (errFindStudentForEnroll, student) => {
    if (errFindStudentForEnroll) return;

    db.EnrollProgram.findOneAndUpdate(
      {
        user_id: student.id,
        program_id: programId,
        'courses.course_id': courseId,
      },
      { $set: { 'courses.$.status_course': 1 } },
      (errEnrollCourse) => {
        if (errEnrollCourse) { res.json({ success: false, error: errEnrollCourse }); return; }

        res.json({ success: true });
      },
    );
  });
});

// Buat start topic, (status topic 0 -> 1)
// PATCH enrollprograms/start_topic/:program_id/
// body : user_id, course_id, topic_id
router.patch('/start_topic/:program_id/', (req, res) => {
  // let program_id = req.params.program_id;
  const studentId = req.body.user_id;
  const courseId = req.body.course_id;
  const topicId = req.body.topic_id;

  db.EnrollProgram.findOneAndUpdate(
    { user_id: studentId },
    { $set: { 'courses.$[outer].topics.$[inner].status_topic': 1 } },
    { arrayFilters: [{ 'outer.course_id': courseId }, { 'inner.topic_id': topicId }] },
    (errStartTopic) => {
      if (errStartTopic) { res.json({ success: false, error: errStartTopic }); return; }
      res.json({ success: true });
    },
  );
});

// Buat finish topic(1->2) kalau semua topic finish, update status course (1 -> 2)
// Kalau prereq course terpenuhi, update status course (-1 -> 0)
// PATCH enrollprograms/finish/:program_id/
// body : user_id, topic_id, course_id
router.patch('/finish/:program_id/', (req, res) => {
  const programId = req.params.program_id;

  db.Student.findOne({ _id: req.body.user_id }, (errStudent, student) => {
    if (errStudent) { res.json({ success: false, error: errStudent }); return; }

    db.Topic.findOne({ _id: req.body.topic_id }, (errTopic, topic) => {
      if (errTopic) { res.json({ success: false, error: errTopic }); return; }

      db.Course.findOne({ _id: req.body.course_id }, (errCourse, course) => {
        if (errCourse) { res.json({ success: false, error: errCourse }); return; }

        db.EnrollProgram.findOneAndUpdate(
          { user_id: student.id },
          { $set: { 'courses.$[outer].topics.$[inner].status_topic': 2 } },
          { arrayFilters: [{ 'outer.course_id': course.id }, { 'inner.topic_id': topic.id }] },
          (errEnroll) => {
            if (errEnroll) { res.json({ success: false, error: errEnroll }); return; }

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
                                res.json({ success: false, error: errUpdateProgram });
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
                                        res.json({ success: false, error: errUpdateCourse });
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
        res.json({ success: true, status_topic: 2 });
      });
    });
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
