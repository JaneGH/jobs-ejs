const { app } = require("../app");
const { factory } = require("../util/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;
const get_chai = require("../util/get_chai");
const User = require("../models/User");

describe("tests for registration and logon", function () {
  // Variables to store CSRF token and cookies
  let csrfToken;
  let csrfCookie;
  let userPassword;
  let newUser;

  it("should get the registration page", async () => {
    const { expect, request } = await get_chai();
    const req = request.execute(app).get("/session/register").send();
    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Enter your name");

    const textNoLineEnd = res.text.replaceAll("\n", "");
    const csrfMatch = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
    expect(csrfMatch).to.not.be.null;

    csrfToken = csrfMatch[1];
    expect(res).to.have.property("headers");
    expect(res.headers).to.have.property("set-cookie");
    const cookies = res.headers["set-cookie"];
    
    csrfCookie = cookies.find((element) => element.startsWith("csrfToken"));
    expect(csrfCookie).to.not.be.undefined;
  });

  it("should register the user", async () => {
    const { expect, request } = await get_chai();
    userPassword = faker.internet.password();
    const user = await factory.build("user", { password: userPassword });

    const dataToPost = {
      name: user.name,
      email: user.email,
      password: userPassword,
      password1: userPassword,
      _csrf: csrfToken,
    };

    const req = request
      .execute(app)
      .post("/session/register")
      .set("Cookie", csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);
      
    const res = await req;
    
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Jobs List");

    newUser = await User.findOne({ email: user.email });
    expect(newUser).to.not.be.null;
  });
});
