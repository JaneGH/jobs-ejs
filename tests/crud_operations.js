// const { app } = require("../app");
// const get_chai = require("../util/get_chai");
// const Job = require("../models/Job");
// const { seed_db, testUserPassword } = require("../util/seed_db");

// describe('CRUD Operations', function() {
//     before(async () => {
//         const { expect, request } = await get_chai();
//         this.user = await seed_db();

//         // Login Helper Function
//         const loginUser = async () => {
//             let req = request.execute(app).get("/sessions/logon").send();
//             let res = await req;

//             // Log response for debugging
//             console.log("Login Response:", res.text);

//             // Extract CSRF token
//             const textNoLineEnd = res.text.replaceAll("\n", "");
//             const csrfToken = /_csrf" value="(.*?)"/.exec(textNoLineEnd);
//             expect(csrfToken).to.not.be.null;
//             this.csrfToken = csrfToken[1];

//             // Log all cookies for debugging
//             const cookies = res.headers["set-cookie"];
//             this.csrfCookie = cookies.find(cookie => cookie.startsWith('_csrf='));

//             const dataToPost = {
//                 email: this.user.email,
//                 password: testUserPassword,
//                 _csrf: this.csrfToken,
//             };
//             req = request
//                 .execute(app)
//                 .post("/sessions/logon")
//                 .set("Cookie", this.csrfCookie)
//                 .set("content-type", "application/x-www-form-urlencoded")
//                 .redirects(0)
//                 .send(dataToPost);
//             res = await req;

//             this.sessionCookie = res.headers["set-cookie"].find(element => element.startsWith("connect.sid"));
//             expect(this.sessionCookie).to.not.be.undefined;

//             // Log cookies for debugging
//             console.log("Session Cookie:", this.sessionCookie);
//             console.log("CSRF Cookie:", this.csrfCookie);
//         };

//         await loginUser();
//     });

//     it("get the job list", async () => {
//         const { expect, request } = await get_chai();

//         expect(this.sessionCookie).to.not.be.undefined;

//         const req = request
//             .execute(app)
//             .get("/jobs")
//             .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
//             .send();

//         const res = await req;

//         expect(res).to.have.status(200);
//         const pageParts = res.text.split("<tr>");
    
//         expect(pageParts.length).to.equal(21);
//     });

//     it('should add a new job entry', async () => {
//         const { expect, request } = await get_chai();
    
//         const jobData = {
//             company: 'New Company',
//             position: 'New Position',
//             status: 'pending',
//             _csrf: this.csrfToken,
//         };
    
//         expect(this.sessionCookie).to.not.be.undefined;
    
//         const req = request
//             .execute(app)
//             .post("/jobs")
//             .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`) 
//             .set("Content-Type", "application/x-www-form-urlencoded") 
//             .redirects(0)
//             .send(jobData); 
    
//         const res = await req; 
    

//         const jobs = await Job.find();
//         console.log("Add Job Response1:", jobs.length);
//         expect(jobs.length).to.equal(21); 
//     });
    
// });
