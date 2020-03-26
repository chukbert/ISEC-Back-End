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
  db.Program.findById(req.params.id).populate('list_course.course_id').exec(function (errProgram, resultProgram) {
    if (errProgram) {
      res.json({ success: false, error: errProgram });
    } else if (!resultProgram) {
      res.json({ success: false, error: 'Program not found' });
    } else {
      new db.EnrollProgram({
        'program_id': resultProgram.id,
        'user_id': req.body.user_id,
        'status_program': 0,
      }).save( function (err, saved) {
        if (err) { res.json({ success: false, error: err }); return; }
        // console.log(resultProgram);
        for (let i = 0; i < resultProgram.list_course.length; i+=1){
          let len = resultProgram.list_course[i].prerequisite.length;
          if (len !== 0){
            len = -1;
          } 
          db.EnrollProgram.findByIdAndUpdate(
            saved.id,
            { $push: { courses: { 
              course_id: resultProgram.list_course[i].course_id.id,
              prerequisite: resultProgram.list_course[i].prerequisite,
              status_course: len
            } } },
            { useFindAndModify: false,
              new: true },
            function (errUpdate) {
              if (errUpdate) { res.json({ success: false, error: errUpdate}); return; }
              for (let j = 0; j < resultProgram.list_course[i].course_id.list_topic.length; j+=1){

                db.EnrollProgram.findOneAndUpdate(
                  { _id: saved.id,
                    'courses.course_id': resultProgram.list_course[i].course_id.id
                  },
                  { $push: { 'courses.$.topics': { 
                    topic_id: resultProgram.list_course[i].course_id.list_topic[j],
                    status_topic: 0
                  } } },
                  { useFindAndModify: false },
                  function (errUpdateEnrollCourse) {
                    if (errUpdateEnrollCourse) { res.json({ success: false, error: errUpdateEnrollCourse}); return; }
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
          (errStudentFind) => {
            if (errStudentFind) { res.json({ success: false, error: errStudentFind}); return; }

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
// PATCH enrollprograms/start/:program_id
// body : user_id
router.patch('/start/:program_id/', (req, res) => {
  let programid = req.params.program_id;
  let username = req.body.user_id;

  db.Student.findOne({ _id: username }, function(errFindStudent, student){
    
    if (errFindStudent) return;
    
    db.EnrollProgram.findOneAndUpdate(
      { 'user_id': student.id, 
        'program_id': programid},
      { $set: {'status_program': 1}},
      (errUpdateStatusProgram) => {
        if (errUpdateStatusProgram) { res.json({ success: false, error: errUpdateStatusProgram}); return; }

        res.json({ success: true });
      });
  });
});

// Buat enroll course, (status course 0 -> 1)
// PATCH enrollprograms/enroll/:program_id/
// body : user_id, course_id
router.patch('/enroll/:program_id/', (req, res) => {
  let programId = req.params.program_id;
  let userId = req.body.user_id;
  let courseId = req.body.course_id;

  db.Student.findOne({ _id: userId }, function(errFindStudentForEnroll, student){
    
    if (errFindStudentForEnroll) return;
    
    db.EnrollProgram.findOneAndUpdate(
      { 'user_id': student.id, 
        'program_id': programId, 
        'courses.course_id': courseId},
      { $set: { 'courses.$.status_course': 1}},
      (errEnrollCourse) => {
        if (errEnrollCourse) { res.json({ success: false, error: errEnrollCourse}); return; }

        res.json({ success: true });
      });
  });
});

// Buat start topic, (status topic 0 -> 1)
// PATCH enrollprograms/start_topic/:program_id/
// body : user_id, course_id, topic_id
router.patch('/start_topic/:program_id/', (req, res) => {
  // let program_id = req.params.program_id;
  let studentId = req.body.user_id;
  let courseId = req.body.course_id;
  let topicId = req.body.topic_id;

  db.EnrollProgram.findOneAndUpdate(
    {  'user_id': studentId, },
    { $set: { "courses.$[outer].topics.$[inner].status_topic": 1 } },
    { arrayFilters: [ {"outer.course_id": courseId}, {"inner.topic_id": topicId}]},
    (errStartTopic) => {
      if (errStartTopic) { res.json({ success: false, error: errStartTopic}); return; }
      res.json({ success: true });

    });
});

// Buat finish topic(1->2) kalau semua topic finish, update status course (1 -> 2)
// Kalau prereq course terpenuhi, update status course (-1 -> 0)
// PATCH enrollprograms/finish/:program_id/
// body : user_id, topic_id, course_id
router.patch('/finish/:program_id/', (req, res) => {
  let programId = req.params.program_id;
  
  db.Student.findOne({ _id: req.body.user_id }, function(errStudent, student) {
    if (errStudent) return (errStudent);

    db.Topic.findOne({ _id: req.body.topic_id }, function(errTopic, topic) {
      if (errTopic) return (errTopic);

      db.Course.findOne({ _id: req.body.course_id }, function(errCourse, course) {
        if (errCourse) return (errCourse);

        db.EnrollProgram.findOneAndUpdate(
          {  'user_id': student.id, },
          { $set: { "courses.$[outer].topics.$[inner].status_topic": 2 } },
          { arrayFilters: [ {"outer.course_id": course.id}, {"inner.topic_id": topic.id}]},
          (errEnroll) => {
            if (errEnroll) { res.json({ success: false, error: errEnroll}); return; }
            
            db.EnrollProgram.findOne(
              { 'user_id': student.id, 
                'program_id': programId},
              function (err, enroll) {
                if (err) return;
                let finished = true;
                for (let i=0; i < enroll.courses.length; i+=1) {
                  if (enroll.courses[i].course_id.toString() === course.id.toString()) {
                    let j = 0;
                    while (j < enroll.courses[i].topics.length && finished){
                      if (enroll.courses[i].topics[j].status_topic !== 2) {
                        finished = false;
                      }
                      j += 1;
                    }
                  }
                }
                

                if (finished) {
                  db.EnrollProgram.findOneAndUpdate(
                    { 'user_id': student.id, 
                      'program_id': programId, 
                      'courses.course_id': course.id},
                    { 'courses.$.status_course': 2},
                    { useFindAndModify: false ,
                      new: true })
                      .populate('program_id')
                      .populate('program_id.list_course.course_id').exec( 
                    function (errFinishCourse, resultEnroll) {
                      if (errFinishCourse) return; 
                      // Buat update kalo program sudah selesai (semua status_course = 2 )
                      let programFinish = true;
                      for (let i=0; i < resultEnroll.courses.length; i+=1) {
                        if (resultEnroll.courses[i].status_course !== 2) {
                          programFinish = false;
                        }
                      }
                      if (programFinish) {
                        db.EnrollProgram.findOneAndUpdate(
                          { 'user_id': student.id, 
                            'program_id': programId },
                          { $set: {'status_program': 2}},
                          { useFindAndModify: false,
                            new:true }, 
                          (errUpdateProgram) => {
                            if (errUpdateProgram) return errUpdateProgram; 
                          });
                      }
                      // Buat update course jika prereqnya finish (-1 -> 0)
                      for (let i=0; i < resultEnroll.courses.length; i+=1) {
                        
                        if (resultEnroll.courses[i].status_course === -1) {
                          
                          for (let j=0; j < resultEnroll.program_id.list_course.length; j+=1) {
                            let courseIdLC = resultEnroll.program_id.list_course[j].course_id.toString();
                            let courseIdEnrollCourse = resultEnroll.courses[i].course_id.toString();
                            if (courseIdLC === courseIdEnrollCourse) {
                              let finishedCourse = true;
                              let k = 0;
                              
                              if (resultEnroll.program_id.list_course[j].prerequisite.length !== null) { 
                                while (k < resultEnroll.program_id.list_course[j].prerequisite.length) {
                                  let idx = resultEnroll.program_id.list_course[j].prerequisite[k];
                                  idx = idx.toString();
                                  for (let l=0; l < resultEnroll.courses.length; l+=1) {
                                    if (resultEnroll.courses[l].course_id.toString() === idx) {
                                      
                                      if (resultEnroll.courses[l].status_course !== 2) {
                                        finishedCourse = false;
                                      }
                                    }
                                  }
                                  k+=1;
                                }
                             }
                              if (finishedCourse) {
                                
                                db.EnrollProgram.findOneAndUpdate(
                                  { 'user_id': student.id, 
                                    'program_id': programId, 
                                    'courses.course_id': resultEnroll.courses[i].course_id.toString() },
                                  { $set: {'courses.$.status_course': 0}},
                                  { useFindAndModify: false,
                                    new:true }, 
                                  (errUpdateCourse) => {
                                    if (errUpdateCourse) return errUpdateCourse; 
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
