const { app } = require("../app");
const { factory, seed_db } = require("../util/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;
const get_chai = require("../util/get_chai");
const User = require("../models/User");

describe("tests for registration and logon", function () {
  before(async () => {
    // Seed the database if needed
    await seed_db();
  });

  it("should get the registration page", async () => {
    const { expect, request } = await get_chai();
    const req = request.execute(app).get("/sessions/register").send();
    const res = await req;
  
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Enter your name");
  
    // Extract CSRF token
    const textNoLineEnd = res.text.replaceAll("\n", "");
    const csrfToken = /_csrf" value="(.*?)"/.exec(textNoLineEnd);
    console.log('Extracted CSRF Token:', csrfToken);
    expect(csrfToken).to.not.be.null;
    this.csrfToken = csrfToken[1];
  
    // Log all cookies for debugging
    const cookies = res.headers["set-cookie"];
    console.log('All Cookies:', cookies);
    
    if (cookies) {
      // Change this line to match your CSRF cookie name
      this.csrfCookie = cookies.find(cookie => cookie.startsWith('_csrf='));
    }
    console.log('Extracted CSRF Cookie:', this.csrfCookie);
    expect(this.csrfCookie).to.not.be.undefined;
  });
  

  it("should register the user", async () => {
    const { expect, request } = await get_chai();
    this.password = faker.internet.password();
    this.user = await factory.build("user", { password: this.password });

    const dataToPost = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .post("/sessions/register")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);
    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Jobs List");

    const newUser = await User.findOne({ email: this.user.email });
    expect(newUser).to.not.be.null;
  });

  it("should log the user on", async () => {
    const { expect, request } = await get_chai();
    const dataToPost = {
      email: this.user.email,
      password: this.password,
      _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);
    const res = await req;

    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal("/");

    const cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    expect(this.sessionCookie).to.not.be.undefined;
  });

  it("should get the index page", async () => {
    const { expect, request } = await get_chai();
    const req = request
      .execute(app)
      .get("/")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .send();
    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include(this.user.name);
  });

  it("should log the user off", async () => {
    const { expect, request } = await get_chai();
    const dataToPost = { _csrf: this.csrfToken };

    const req = request
      .execute(app)
      .post("/sessions/logoff")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);
    const res = await req;

    expect(res).to.have.status(200);
    expect(res.text).to.include("Click this link to logon");
  });
});
