const mongoose = require('mongoose');
const db = require('./models');
const {Topic, Course, Program, Teacher, Admin, Student, EnrollProgram} = db;

async function initialize(){

    await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
        .catch((error) => {
            console.log("DB error", error);
        });

    var topic1 = await new Topic({
        name : 'Inheritance'
    }).save();

    var topic2 = await new Topic({
        name : 'Exception'
    }).save();

    var topic3 = await new Topic({
        name : 'Android'
    }).save();

    var course1 = await new Course({
        name: 'Object-oriented Programming',
        code : 'IF2110',
        description : 'lorem ipsum',
        list_topic : [topic1.id, topic2.id]
    }).save();

    var course2 = await new Course({
        name: 'Platform-Based Development',
        code : 'IF3210',
        description : 'lorem ipsum',
        list_topic : [topic3.id]
    }).save();

    var program1 = await new Program({
        name : 'Teknik Informatika',
        description : 'lorem ipsum dono?',
        list_teacher : [],
        list_course : [{
            course_id: course1.id,
            prerequisite: []
        },{
            course_id: course2.id,
            prerequisite: [course1.id]
        }]
    }).save();


    var teacher1 = await new Teacher({
        username : 'teacher1',
        email : 'teacher1@example.com',
        role : 1,
        password : 'teacher1',
        programs : [{program_id: program1.id, course_id : [course1.id, course2.id]}]
    }).save((err, saved_test) => {
        if (err) {console.log(err); return;}
        Program.update(
            { _id: program1.id }, 
            { $push: {list_teacher: saved_test.id} }
        );
    });

    var teacher2 = await new Teacher({
        username : 'teacher2',
        email : 'teacher2@example.com',
        role : 1,
        password : 'teacher2',
        programs : [{program_id: program1.id, course_id : [course1.id]}]
    }).save((err, saved_test) => {
        if (err) {console.log(err); return;}
        Program.update(
            { _id: program1.id }, 
            { $push: {list_teacher: saved_test.id} }
        );
    });

    var admin = await new Admin({
        username: 'admin',
        email: 'admin@example.com',
        role: 2,
        password: 'admin',
        program_id: [program1.id]
    }).save();

    var student1 = await new Student({
        username: 'student1',
        email: 'student1@example.com',
        role: 0,
        password: 'student1',
        enrollprogram_id: []
    }).save();

    var enrollprogram1 = await new EnrollProgram({
        user_id: student1.id,
        program_id: program1.id,
        status_program: 0,
        courses: [{
            course_id: course1.id,
            status_course: 1,
            topics: [{
                topic_id: topic1.id,
                status_topic: 1
            }]
        }]
    }).save((err, saved_test) => {
        if (err) {console.log(err);return;}
        Student.update(
            { _id: student1.id }, 
            { $push: {enrollprogram_id: saved_test.id} }
        );
    });
    console.log("done init db");
    process.exit();
}

initialize();
