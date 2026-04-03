hey i want to make some changes in the signup setup.

so there will be more students who will be needing for internship, but we cant provide to everyone, so what we were thinking was. we will have one exam page in same portal, iw ill provide the codebase as well(we need some changes in that).


what we will do now means, 

/assesment(where user will going to write exam for eligibility to use the internship portal).

we will have one signup way where they will enter email,password, track.

then user will enter to the assessment page, after this according to the track they will have different exams for 1 hour, 60 questions(it will vary).

after writing, they will submit , we have 1 day of buffer time. 
if the user gets above 75% in exam result, they will get email after one day automatically syaing, you got selected and use the same email and password to login,

so after exam they will login for first time, at that time they will be asked for details like name,number,gender, dob,education qualification,course,collegeworkiing details(if applicable),working details.

upload passport size photo, aadhar card photo, then click to verify, it will redirect to digilocker to verify with aadhar, then after verification it will come to our page.(3 tries, if they cant verify, it will stop).

after verification, it will take to our dashboard.

now i will come to /admin.
we will have one page, in that we can see how many students wrote exam, who and all didnt. then after that admin will have one sort section. above 75% they can send confirmation that they are eligible.

so you may confused the method i am saying, so basically there 2 types of accepting interns, automatic way, another way is manual admin clicking by sending approval.

then after that we have to setup middleware (proxy) where no student will be having the access to see the assessment page again after one attempt with same email(if they wrote the exam).


DigiExam
 i have attached the exam portal code, add it in the routing files(create new with that with internship portal colouring).

we need to change one more thing in the manage admin page, where 2 section(manage admin, manage interns) we can interns over here also.

chaneg the name in the side bar as add users.

think well, add properly everything