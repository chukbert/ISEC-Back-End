const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const nocache = require('nocache');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const topicsRouter = require('./routes/topics');
const coursesRouter = require('./routes/courses');
const programsRouter = require('./routes/programs');
const enrollProgramsRouter = require('./routes/enrollPrograms');


const app = express();

app.set('etag', false);
app.use(nocache());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/topics', topicsRouter);
app.use('/courses', coursesRouter);
app.use('/programs', programsRouter);
app.use('/enrollprograms', enrollProgramsRouter);

module.exports = app;
