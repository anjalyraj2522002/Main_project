var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var hbs = require("express-handlebars");
const moment = require("moment");
var usersRouter = require("./routes/users");
var adminRouter = require("./routes/admin");
var govtRouter = require("./routes/govt");
var fileUpload = require("express-fileupload");
var db = require("./config/connection");
var session = require("express-session");
var app = express();
const Handlebars = require('handlebars');


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

// Set up Handlebars engine with helpers
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/header-partials/",
    helpers: {
      incremented: function (index) {
        index++;
        return index;
      },
      encodeURIComponent: function (str) {
      return encodeURIComponent(str);
    },
      formatDateTime:(dateTime) => {
        if (!dateTime) return "Not Available"; // Handle null, undefined, or empty values
    let formattedDate = moment(dateTime, "YYYY-MM-DDTHH:mm", true); // Strict parsing

    if (!formattedDate.isValid()) return "Not Available"; // Check for invalid dates

    return formattedDate.format("DD-MM-YY hh:mm A");
    },
      daysElapsed:function(date){
          const givenDate = moment(date, "YYYY-MM-DD");
          const today = moment();
          return today.diff(givenDate, "days");
      },
      eq: function (a, b) {
        return a === b;
      },
      isImage:function (filename) {
        return filename.match(/\.(jpg|jpeg|png)$/i) ? true : false;
      },
      isVideo:function (filename) {
        return filename.match(/\.(mp4|avi|mov)$/i) ? true : false;
      },
      isPDF:function (filename) {
        return filename.match(/\.pdf$/i) ? true : false;
      },
      formatDate: function (dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`; // Return the formatted date
      },
      currentDateTime: function () {
        return moment().format("YYYY-MM-DDTHH:mm")
      },
    },
  })
);



app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(
  session({
    secret: "Key",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day in milliseconds
  })
);
db.connect((err) => {
  if (err) console.log("Error" + err);
  else console.log("Database Connected Successfully");
});
app.use("/", usersRouter);
app.use("/admin", adminRouter);
app.use("/govt", govtRouter);
app.use("/admin/users", adminRouter);
app.use("/admin/builder", adminRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
