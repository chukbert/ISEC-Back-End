db.topic.insert(
    {
        "_id" : ObjectId("topic1"),
        "name" : "Inheritance" 
    }
)


db.topic.insert(
    {
        "_id" : ObjectId("topic2"),
        "name" : "Exception" 
    }
)

db.topic.insert(
    {
        "_id" : ObjectId("topic3"),
        "name" : "Android" 
    }
)

db.course.insert (
    {"_id" : ObjectId("course1"),
     "name" : "Object-oriented Programming",
     "code" : "IF2110",
     "description" : "lorem ipsum",
     "list_topic" : [
         ObjectId("topic1"),
         ObjectId("topic2")
     ]}

)

db.course.insert (
    {"_id" : ObjectId("course2"),
     "name" : "PBD",
     "code" : "IF3210",
     "description" : "lorem ipsum",
     "list_topic" : [
        ObjectId("topic3")
     ]}

)

db.teacher.insert(
    {
        "_id" : ObjectId("teacher1"),
        "username" : "teacher1",
        "email" : "teacher1@example.com",
        "role" : 1,
        "password" : "teacher1",
        "programs" : [
            {
                "program_id" : ObjectId("program1"),
                "course_id" : [
                    ObjectId("course1"),
                    ObjectId("course2")
                ]
            }
        ]
    }
)

db.teacher.insert(
    {
        "_id" : ObjectId("teacher2"),
        "username" : "teacher2",
        "email" : "teacher2@example.com",
        "role" : 1,
        "password" : "teacher2",
        "programs" : [
            {
                "program_id" : ObjectId("program1"),
                "course_id" : [
                    ObjectId("course1")
                ]
            }
        ]
    }
)

db.program.insert (
    {   
        "_id" : ObjectId("program1"),
        "name" : "Teknik Informatika",
        "description" : "lorem ipsum dono?",
        "list_teacher" : [ObjectId("teacher1"), ObjectId("teacher2")],
        "list_course" : [
            {
                "course_id": ObjectId("course1"),
                "prerequisite": []
            },
            {
                "course_id": ObjectId("course2"),
                "prerequisite": [ObjectId("course1")]
            }
        ]
    }
)







db.admin.insert(
    {
        "username" : "admin",
        "email" : "admin@example.com",
        "role" : 2,
        "password" : "admin",
        "program_id" : [ObjectId("program1")]
    }
)



db.student.insert(
    {
        "_id" : ObjectId("student1"),
        "username" : "student1",
        "email" : "student1@example.com",
        "role" : 0,
        "password" : "student1",
        "enrollprogram_id" : [ObjectId("enroll1")]
    }
)

db.enrollprogram.insert(
    {
        "_id" : ObjectId("enroll"),
        "user_id" : ObjectId("student1"),
        "program_id" : ObjectId("program1"),
        "status" : 0,
        "courses" : [
            {
                "courses_id" : ObjectId("course1"),
                "status" : 1,
                "topics" : [ {
                    "topic_id" : ObjectId("topic1"),
                    "status" : 1
                 }
                ]
            } 
        ]
    }
)




