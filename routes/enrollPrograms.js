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

router.post('/new/:id', (req, res) => {
  db.Program.findById(req.params.id).populate('list_course.course_id').exec(function (errProgram, resultProgram) {
    if (errProgram) {
      res.json({ success: false, error: errProgram });
    } else if (!resultProgram) {
      res.json({ success: false, error: 'Program not found' });
    } else {
      new db.EnrollProgram({
        'program_id': resultProgram.id,
        'user_id': req.body.userid,
        'status_program': 0,
      }).save( function (err, saved) {
        if (err) { res.json({ success: false, error: err }); return; }
        console.log(resultProgram);
        for (let i = 0; i < resultProgram.list_course.length; i++){
          let len = resultProgram.list_course[i].prerequisite.length;
          if (len != 0){
            len = -1;
          } 
          db.EnrollProgram.findByIdAndUpdate(
            saved.id,
            { $push: { courses: { 
              course_id: resultProgram.list_course[i].course_id._id,
              prerequisite: resultProgram.list_course[i].prerequisite,
              status_course: len
            } } },
            { useFindAndModify: false,
              new: true },
            function (errUpdate, resultUpdate) {
              if (errUpdate) { res.json({ success: false, error: errUpdate}); return; }
              for (let j = 0; j < resultProgram.list_course[i].course_id.list_topic.length; j++){

                db.EnrollProgram.findOneAndUpdate(
                  { _id: saved.id,
                    'courses.course_id': resultProgram.list_course[i].course_id._id
                  },
                  { $push: { 'courses.$.topics': { 
                    topic_id: resultProgram.list_course[i].course_id.list_topic[j],
                    status_topic: 0
                  } } },
                  { useFindAndModify: false },
                  function (errUpdate, resultUpdate) {
                    if (errUpdate) { res.json({ success: false, error: errUpdate}); return; }
                  }
                );
              }
            }
          );  
        } 
        db.Student.findByIdAndUpdate(
          saved.user_id,
          { $push: { 'enrollprogram_id': saved.id } },
          { useFindAndModify: false },
          (err) => {
            if (err) { res.json({ success: false, error: err}); return; }

            res.json({ success: true, id:saved.id, user_id:saved.user_id });
          });
      });
    }
  });
});

// "username": "student1",
// 	"topic_name": "Inheritance",
//   "course_name": "Object-oriented Programming"

// Buat start pertama kali program, (status program 0 -> 1)
router.patch('/start/:program_id/', (req, res) => {
  let program_id = req.params.program_id;
  let username = req.body.user_id;

  db.Student.findOne({ _id: username }, function(err, student){
    
    if (err) return handleError(err);
    
    db.EnrollProgram.findOneAndUpdate(
      { 'user_id': student.id, 
        'program_id': program_id},
      { $set: {'status_program': 1}},
      (err) => {
        if (err) { res.json({ success: false, error: err}); return; }

        res.json({ success: true });
      });
  });
});

// Buat enroll course, (status course 0 -> 1)
router.patch('/enroll/:program_id/', (req, res) => {
  let program_id = req.params.program_id;
  let user_id = req.body.user_id;
  let course_id = req.body.course_id;

  db.Student.findOne({ _id: user_id }, function(err, student){
    
    if (err) return handleError(err);
    
    db.EnrollProgram.findOneAndUpdate(
      { 'user_id': student.id, 
        'program_id': program_id, 
        'courses.course_id': course_id},
      { $set: { 'courses.$.status_course': 1}},
      (err) => {
        if (err) { res.json({ success: false, error: err}); return; }

        res.json({ success: true });
      });
  });
});

// Buat start topic, (status topic 0 -> 1)
router.patch('/start_topic/:program_id/', (req, res) => {
  // let program_id = req.params.program_id;
  let student_id = req.body.user_id;
  let course_id = req.body.course_id;
  let topic_id = req.body.topic_id;

  db.EnrollProgram.findOneAndUpdate(
    {  'user_id': student_id, },
    { $set: { "courses.$[outer].topics.$[inner].status_topic": 1 } },
    { arrayFilters: [ {"outer.course_id": course_id}, {"inner.topic_id": topic_id}]},
    (errStartTopic) => {
      if (errStartTopic) { res.json({ success: false, error: errStartTopic}); return; }
      res.json({ success: true });

    });
});

router.patch('/finish/:program_id/', (req, res) => {
  let program_id = req.params.program_id;
  
  db.Student.findOne({ _id: req.body.user_id }, function(errStudent, student) {
    if (errStudent) return handleError(errStudent);

    db.Topic.findOne({ _id: req.body.topic_id }, function(errTopic, topic) {
      if (errTopic) return handleError(errTopic);

      db.Course.findOne({ _id: req.body.course_id }, function(errCourse, course) {
        if (errCourse) return handleError(errCourse);

        db.EnrollProgram.findOneAndUpdate(
          {  'user_id': student.id, },
          { $set: { "courses.$[outer].topics.$[inner].status_topic": 2 } },
          { arrayFilters: [ {"outer.course_id": course.id}, {"inner.topic_id": topic.id}]},
          (errEnroll) => {
            if (errEnroll) { res.json({ success: false, error: errEnroll}); return; }
            
            db.EnrollProgram.findOne(
              { 'user_id': student.id, 
                'program_id': program_id},
              function (err, enroll) {
                if (err) return;
                let finished = true;
                for (let i=0; i < enroll.courses.length; i++) {
                  if (enroll.courses[i].course_id == course.id) {
                    let j = 0;
                    while (j < enroll.courses[i].topics.length && finished){
                      if (enroll.courses[i].topics[j].status_topic != 2) {
                        finished = false;
                      }
                      j += 1;
                    }
                  }
                }
                

                if (finished) {
                  db.EnrollProgram.findOneAndUpdate(
                    { 'user_id': student.id, 
                      'program_id': program_id, 
                      'courses.course_id': course.id},
                    { 'courses.$.status_course': 2},
                    { useFindAndModify: false ,
                      new: true })
                      .populate('program_id')
                      .populate('program_id.list_course.course_id').exec( 
                    function (errEnroll, resultEnroll) {
                      if (errEnroll) return; 
                      // Buat update kalo program sudah selesai (semua status_course = 2 )
                      let programFinish = true;
                      for (let i=0; i < resultEnroll.courses.length; i++) {
                        if (resultEnroll.courses[i].status_course != 2) {
                          programFinish = false;
                        }
                      }
                      if (programFinish) {
                        db.EnrollProgram.findOneAndUpdate(
                          { 'user_id': student.id, 
                            'program_id': program_id },
                          { $set: {'status_program': 2}},
                          { useFindAndModify: false,
                            new:true }, 
                          (errUpdateProgram, resUpdateProgram) => {
                            if (errUpdateProgram) return; 
                          });
                      }
                      // Buat update course jika prereqnya finish (-1 -> 0)
                      for (let i=0; i < resultEnroll.courses.length; i++) {
                        
                        if (resultEnroll.courses[i].status_course === -1) {
                          
                          for (let j=0; j < resultEnroll.program_id.list_course.length; j++) {
                            
                            if (resultEnroll.program_id.list_course[j].course_id.toString() == resultEnroll.courses[i].course_id.toString()) {
                              let finishedCourse = true;
                              let k = 0;
                              
                              if (resultEnroll.program_id.list_course[j].prerequisite.length != null) { 
                                while (k < resultEnroll.program_id.list_course[j].prerequisite.length) {
                                  let idx = resultEnroll.program_id.list_course[j].prerequisite[k];
                                  for (let l=0; l < resultEnroll.courses.length; l++) {
                                    if (resultEnroll.courses[l].course_id == idx) {
                                      
                                      if (resultEnroll.courses[l].status_course != 2) {
                                        finishedCourse = false;
                                      }
                                    }
                                  }
                                  k++;
                                }
                             }
                              if (finishedCourse) {
                                
                                db.EnrollProgram.findOneAndUpdate(
                                  { 'user_id': student.id, 
                                    'program_id': program_id, 
                                    'courses.course_id': resultEnroll.courses[i].course_id.toString() },
                                  { $set: {'courses.$.status_course': 0}},
                                  { useFindAndModify: false,
                                    new:true }, 
                                  (errUpdateCourse, resUpdateCourse) => {
                                    if (errUpdateCourse) return; 
                                  });
                              } 
                            }
                          }
                        }
                      }  
                    });
                };
              });     
          });
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
