const express = require("express");
require("express-async-errors");
const bodyParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET)); // Add cookie-parser middleware

// Set up security middleware
app.use(helmet()); // Set security headers
app.use(xss()); // Prevent XSS attacks
app.use(rateLimit({ // Rate limiting
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
}));

// Set up sessions
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "mySessions",
});
store.on("error", (error) => {
  console.log(error);
});

const sessionParams = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParams.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParams));
app.use(flash());

const passport = require("passport");
const passportInit = require("./passport/passportInit");

passportInit();
app.use(passport.initialize());
app.use(passport.session());

// CSRF Protection
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" } });
app.use(csrfProtection);

// Middleware to expose CSRF token to views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

// Routes
const secretWordRouter = require("./routes/secretWord");
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

// Include the jobs routes
const jobRouter = require("./routes/jobs");
app.use("/jobs", auth, jobRouter);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

async function startServer() {
  await require("./db/connect")(process.env.MONGO_URI);
}

startServer();
const start = async () => {
  try {
    startServer();
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
