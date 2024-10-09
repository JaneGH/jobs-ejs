const express = require("express");
const flash = require("connect-flash");

require("express-async-errors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

// TESTING ENVIRONMENT
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  console.log("------!!!TESTING ENVIRONMENT ACTIVE!!!------");
  mongoURL = process.env.MONGO_URI_TEST;
}

// EXTRA SECURITY PACKAGES
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

const app = express();

app.use(
  rateLimiter({
    windowsMs: 15 * 60 * 1000, //15 minutes
    max: 100, //limits each IP to 100 requests per windowsMs
  })
);
app.use(helmet());
app.use(xss());

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

// MONGO/SESSION
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const store = new MongoDBStore({
  uri: mongoURL,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
app.use(flash());

// CSRF Middleware

const csrf = require("host-csrf");

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.urlencoded({ extended: false }));
let csrf_development_mode = true;
if (app.get("env") === "production") {
  csrf_development_mode = false;
  app.set("trust proxy", 1);
}
const csrf_options = {
  protected_operations: ["PATCH"],
  protected_content_types: ["application/json"],
  development_mode: csrf_development_mode,
};
const csrf_middleware = csrf(csrf_options); //initialize and return middleware

// MULTIPLY MIDDLEWARE
app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});

// PASSPORT
const passport = require("passport");
const passportInit = require("./passport/passportInit.js");

passportInit();
app.use(passport.initialize());
app.use(passport.session());
//

app.use(require("./middleware/storeLocals.js"));
app.get("/", csrf_middleware, (req, res) => {
  res.render("index");
});
app.use("/sessions", csrf_middleware, require("./routes/sessionRoutes.js"));

// SECRET WORD HANDLING
const secretWordRouter = require("./routes/secretWord.js");
const auth = require("./middleware/auth.js");
app.use("/secretWord", auth, csrf_middleware, secretWordRouter);

//JOBS ROUTING
const jobRouter = require("./routes/jobs");
app.use("/jobs", auth, csrf_middleware, jobRouter);
//

app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});


app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = () => {
  try {
    require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };