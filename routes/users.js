/* eslint-disable no-param-reassign */
const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db/models');

const router = express.Router();

router.get('/', auth, (req, res) => {
  db.Student.findById(req.id).populate('enrollprogram_id').lean().exec()
    .then((resultStudent) => {
      if (!resultStudent) {
        db.Teacher.findById(req.id).populate('programs.program_id').lean().exec()
          .then((resultTeacher) => {
            if (!resultTeacher) {
              db.Admin.findById(req.id).populate('program_id').lean().exec()
                .then((resultAdmin) => {
                  res.json({ data: resultAdmin, success: !!resultAdmin });
                }, (err) => {
                  res.json({ success: false, error: err });
                });
            } else {
              res.json({ data: resultTeacher, success: !!resultTeacher });
            }
          }, (err) => {
            res.json({ success: false, error: err });
          });
      } else {
        res.json({ data: resultStudent, success: !!resultStudent });
      }
    }, (err) => {
      res.json({ success: false, error: err });
    });
});

// router.get('/student', (req, res) => {
//   db.Student.find().lean().exec()
//     .then((val) => {
//       res.json({ data: val, success: !!val });
//     }, (err) => {
//       res.json({ success: false, error: err });
//     });
// });

// router.get('/teacher', (req, res) => {
//   db.Teacher.find().lean().exec()
//     .then((val) => {
//       res.json({ data: val, success: !!val });
//     }, (err) => {
//       res.json({ success: false, error: err });
//     });
// });

// router.get('/admin', (req, res) => {
//   db.Admin.find().lean().exec()
//     .then((val) => {
//       res.json({ data: val, success: !!val });
//     }, (err) => {
//       res.json({ success: false, error: err });
//     });
// });

router.post('/login', (req, res) => {
  const { username, email, password } = req.body;
  const query = username ? { username } : { email };
  db.Student.findOne(query, (errStudent, resultStudent) => {
    if (errStudent) {
      res.json({ success: false, error: errStudent });
    } else if (!resultStudent) {
      db.Teacher.findOne(query, (errTeacher, resultTeacher) => {
        if (errTeacher) {
          res.json({ success: false, error: errTeacher });
        } else if (!resultTeacher) {
          db.Admin.findOne(query, (errAdmin, resultAdmin) => {
            if (errAdmin) {
              res.json({ success: false, error: errAdmin });
            } else if (!resultAdmin) {
              res.json({ success: false, error: 'User not found' });
            } else {
              resultAdmin.comparePassword(password, (err, match) => {
                if (err || !match) {
                  res.json({ success: false, error: err, match });
                } else {
                  res.json({ success: true, token: resultAdmin.generateAuthToken() });
                }
              });
            }
          });
        } else {
          resultTeacher.comparePassword(password, (err, match) => {
            if (err || !match) {
              res.json({ success: false, error: err, match });
            } else {
              res.json({ success: true, token: resultTeacher.generateAuthToken() });
            }
          });
        }
      });
    } else {
      resultStudent.comparePassword(password, (err, match) => {
        if (err || !match) {
          res.json({ success: false, error: err, match });
        } else {
          res.json({ success: true, token: resultStudent.generateAuthToken() });
        }
      });
    }
  });
});

router.post('/register', (req, res) => {
  const {
    username, email, password, role,
  } = req.body;
  if (role === 0) {
    new db.Student({
      username, email, password, role,
    }).save((err, saved) => {
      if (err) {
        res.json({ success: false, error: err });
      } else {
        res.json({ success: true, token: saved.generateAuthToken() });
      }
    });
  } else if (role === 1) {
    new db.Teacher({
      username, email, password, role,
    }).save((err, saved) => {
      if (err) {
        res.json({ success: false, error: err });
      } else {
        res.json({ success: true, token: saved.generateAuthToken() });
      }
    });
  } else if (role === 2) {
    new db.Admin({
      username, email, password, role,
    }).save((err, saved) => {
      if (err) {
        res.json({ success: false, error: err });
      } else {
        res.json({ success: true, token: saved.generateAuthToken() });
      }
    });
  } else {
    res.json({ success: false, error: 'Wrong role' });
  }
});

router.post('/auth', auth, (req, res) => {
  db.Student.findById(req.id, (errStudent, resultStudent) => {
    if (errStudent) {
      res.json({ success: false, error: errStudent });
    } else if (!resultStudent) {
      db.Teacher.findById(req.id, (errTeacher, resultTeacher) => {
        if (errTeacher) {
          res.json({ success: false, error: errTeacher });
        } else if (!resultTeacher) {
          db.Admin.findById(req.id, (errAdmin, resultAdmin) => {
            if (errAdmin) {
              res.json({ success: false, error: errAdmin });
            } else if (!resultAdmin) {
              res.json({ success: false, error: 'Wrong Token' });
            } else {
              res.json({ success: true, username: resultAdmin.username, role: resultAdmin.role });
            }
          });
        } else {
          res.json({ success: true, username: resultTeacher.username, role: resultTeacher.role });
        }
      });
    } else {
      res.json({ success: true, username: resultStudent.username, role: resultStudent.role });
    }
  });
});

router.patch('/edit', auth, (req, res) => {
  const {
    username, email, password,
  } = req.body;
  db.Student.findById(req.id, (errStudent, resultStudent) => {
    if (errStudent) {
      res.json({ success: false, error: errStudent });
    } else if (!resultStudent) {
      db.Teacher.findById(req.id, (errTeacher, resultTeacher) => {
        if (errTeacher) {
          res.json({ success: false, error: errTeacher });
        } else if (!resultTeacher) {
          db.Admin.findByIdAndUpdate(req.id, req.body, { new: true }, (errAdmin, resultAdmin) => {
            if (errAdmin) {
              res.json({ success: false, error: errAdmin });
            } else if (!resultAdmin) {
              res.json({ success: false, error: 'Wrong Token' });
            } else {
              // eslint-disable-next-line no-param-reassign
              if (username) resultAdmin.username = username;
              if (email) resultAdmin.email = email;
              if (password) resultAdmin.password = password;
              resultAdmin.save();
              res.json({ success: true, username: resultAdmin.username, role: resultAdmin.role });
            }
          });
        } else {
          // eslint-disable-next-line no-param-reassign
          if (username) resultTeacher.username = username;
          if (email) resultTeacher.email = email;
          if (password) resultTeacher.password = password;
          resultTeacher.save();
          res.json({ success: true, username: resultTeacher.username, role: resultTeacher.role });
        }
      });
    } else {
      // eslint-disable-next-line no-param-reassign
      if (username) resultStudent.username = username;
      if (email) resultStudent.email = email;
      if (password) resultStudent.password = password;
      resultStudent.save();
      res.json({ success: true, username: resultStudent.username, role: resultStudent.role });
    }
  });
});

module.exports = router;
