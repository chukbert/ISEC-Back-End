const express = require('express');

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

router.post('/new', (req, res) => {
  new db.EnrollProgram(req.body).save((err, saved) => {
    if (err) { res.json({ success: false, error: err }); return; }

    db.Student.findByIdAndUpdate(
      saved.user_id,
      { $push: { 'enrollprogram_id': saved.id } },
      { useFindAndModify: false },
      (err) => {
        if (err) { res.json({ success: false, error: err}); return; }

        res.json({ success: true, id:saved.id, user_id:saved.user_id });
      });
  });
});

// "username": "student1",
// 	"topic_name": "Inheritance",
//   "course_name": "Object-oriented Programming"
  
router.patch('/start/:program_id/', (req, res) => {
  let program_id = req.params.program_id;
  let username = req.body.username;
  let course_id = req.body.course_id;

  db.Student.findOne({ 'username': username }, function(err, student){
    
    if (err) return handleError(err);
    
    db.EnrollProgram.findOneAndUpdate(
      { 'user_id': student.id, 
        'program_id': program_id, 
        'courses.course_id': course_id},
      { 'courses.$.status_course': 1},
      (err) => {
        if (err) { res.json({ success: false, error: err}); return; }

        res.json({ success: true });
      });
  });
});

router.patch('/finish/:program_id/', (req, res) => {
  let program_id = req.params.program_id;
  
  db.Student.findOne({ 'username': req.body.username }, function(err, student) {
    if (err) return handleError(err);

    db.Topic.findOne({ 'name': req.body.topic_name }, function(err, topic) {
      if (err) return handleError(err);

      db.Course.findOne({ 'name': req.body.course_name }, function(err, course) {
        if (err) return handleError(err);

        db.EnrollProgram.findOneAndUpdate(
          { 'user_id': student.id, 
            'program_id': program_id, 
            'courses.course_id': course.id,
            'courses.topics.topic_id': topic.id},
          { 'courses.$[idx].topics.$[].status_topic': 2},
          { new: true, 
            useFindAndModify: false,
            arrayFilters: [  { "idx": {'courses.course_id': course.id } } ],
            multi: false},
          (err) => {
            if (err) { res.json({ success: false, error: err}); return; }
            db.EnrollProgram.findOne(
              { 'user_id': student.id, 
                'program_id': program_id,
                'courses.course_id': course.id},
              // { populate: 'courses.topics.topic_id'},
              (err, enroll) => {
                if (err) return;
                let finished = true;
                console.log(enroll);
                for (let i = 0; i < enroll.courses.topics.length; i++) {
                  if (enroll.courses[0].topics[i].status_topic != 2) {
                    finished = false;
                  }
                }
                if (finished) {
                  db.EnrollProgram.findOneAndUpdate(
                    { 'user_id': student.id, 
                      'program_id': program_id, 
                      'courses.course_id': course_id},
                    { 'courses.$.status_course': 2},
                    { useFindAndModify: false },
                    (err) => {
                      if (err) { res.json({ success: false, error: err}); return; }
              
                      res.json({ success: true, status_course: 2 });
                    });
                }
              }
            )
            res.json({ success: true, status_topic: 2 });
        });
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
