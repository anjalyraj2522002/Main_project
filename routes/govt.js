var express = require("express");
var govtHelper = require("../helper/govtHelper");
var fs = require("fs");
const userHelper = require("../helper/userHelper");
const adminHelper = require("../helper/adminHelper");

var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;


const verifySignedIn = (req, res, next) => {
  if (req.session.signedInGovt) {
    next();
  } else {
    res.redirect("/govt/signin");
  }
};

/* GET admins listing. */
router.get("/", verifySignedIn, function (req, res, next) {
  let govt = req.session.govt;
  govtHelper.getAllAssingedComlaints(govt._id).then((cmp) => {
      console.log(cmp)
      res.render("govt/home", { govt: true, cmp, layout: "layout"});
    });
});
router.get("/home", verifySignedIn, function (req, res, next) {
  let govt = req.session.govt;
  govtHelper.getAllAssingedComlaints(govt._id).then((cmp) => {
      console.log(cmp)
      res.render("govt/home", { govt: true, cmp, layout: "layout"});
    });
});

router.get("/view-cmp/:id", verifySignedIn,async function (req, res, next) {
  let govt = req.session.govt;
  let cmpId = req.params.id;
  let cmp = await govtHelper.getComplaintDetails(cmpId);
  let officials = await govtHelper.getOfficialsDetails(govt._id); 
   // console.log(officials,"viewwwwwww")
    res.render("govt/view-complaint", { govt: true, cmp, officials, layout: "layout", govt });
});

router.post("/update-status", verifySignedIn, async function (req, res) {
  let govt = req.session.govt;
  let { complaintId, status, remarks } = req.body;

  try {
      let result = await govtHelper.updateComplaintStatus(complaintId, status, remarks,govt);
      if (result.modifiedCount > 0) {
          res.json({ success: true });
      } else {
          res.json({ success: false });
      }
  } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
router.get("/request-meeting", verifySignedIn,async function (req, res, next) {
  let govt = req.session.govt;
  let meetings = await govtHelper.getAllRequestbyGovt(govt._id);
    console.log(meetings,"viewwwwwww")
    res.render("govt/request-meeting", { govt: true,layout: "layout", govt ,meetings});
});

router.get("/all-notifications",verifySignedIn,async (req,res)=>{
  console.log("//nootttttttt$$$$$$$$$$$$$$$$$$$$$$$$$")
  let govt = req.session.govt;
  govtHelper.getAllnotifications(govt._id).then((notifications) => {
    console.log(notifications)
    res.render("govt/all-notifications", { govt: true,layout: "layout", govt ,notifications});
  });
  
});
router.post("/request-meeting", async (req, res) => {
  try {
      let official = req.session.govt;
      let { remarks, departments,subject } = req.body;

      if (!official) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      let meetingRequest = {
          requestedBy: official._id,
          requestedByName: official.Name,
          requestedByEmail:official.Email,
          subject:subject,
          departments: departments,  // List of selected departments
          status: "Pending",
          scheduledTime: null,
          remarks: remarks,
          createdAt: new Date()
      };

      await db.get().collection(collections.MEETINGS_COLLECTION).insertOne(meetingRequest);
      res.json({ success: true, message: "Meeting request sent!" });
  } catch (error) {
      console.error("Error sending meeting request:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

///reports
router.get("/reports", verifySignedIn,async function (req, res, next) {
  let govt = req.session.govt;
    res.render("govt/reports", { govt: true,layout: "layout", govt});
});
router.get("/pending-report",verifySignedIn, async (req, res) => {
 
  let govt = req.session.govt;
  let { fromDate, toDate } = req.query;
  let complaints = await govtHelper.getComplaintsByStatus("Pending", fromDate, toDate,govt.Department);
  res.render("govt/report-view", { govt: true,layout: "layout",govt, complaints, title: "Pending Review Complaints" });
});
router.get("/under-process-report",verifySignedIn, async (req, res) => {
 
  let govt = req.session.govt;
  let { fromDate, toDate } = req.query;
  let complaints = await govtHelper.getComplaintsByStatus("Under Process", fromDate, toDate,govt.Department);
  res.render("govt/report-view", { govt: true,layout: "layout",govt, complaints, title: "Pending Review Complaints" });
});
router.get("/pending-report",verifySignedIn, async (req, res) => {
 
  let govt = req.session.govt;
  let { fromDate, toDate } = req.query;
  let complaints = await govtHelper.getComplaintsByStatus("Pending", fromDate, toDate,govt.Department);
  res.render("govt/report-view", { govt: true,layout: "layout",govt, complaints, title: "Under Process Complaints" });
});
router.get("/rejected-report",verifySignedIn, async (req, res) => {
 
  let govt = req.session.govt;
  let { fromDate, toDate } = req.query;
  let complaints = await govtHelper.getComplaintsByStatus("Rejected", fromDate, toDate,govt.Department);
  res.render("govt/report-view", { govt: true,layout: "layout",govt, complaints, title: "Rejected Complaints" });
});

router.get("/resolved-report",verifySignedIn, async (req, res) => {
 
  let govt = req.session.govt;
  let { fromDate, toDate } = req.query;
  let complaints = await govtHelper.getComplaintsByStatus("Resolved", fromDate, toDate,govt.Department);
  res.render("govt/report-view", { govt: true,layout: "layout",govt, complaints, title: "Resolved Complaints" });
});
//feedback & rating
router.get("/feedback/:complaintId", verifySignedIn, async (req, res) => {
  try {
    const { complaintId } = req.params;
    let govt = req.session.govt;
    // Fetch the feedback record for this complaint (assuming one record per user per complaint).
    const feedback = await db.get().collection(collections.FEEDBACK_COLLECTION).findOne({ complaintId });
    res.render("govt/all-feedbacks", { govt: true,layout: "layout",govt, feedback });
  } catch (error) {
    console.error("Error fetching feedback", error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/feedback", verifySignedIn, async (req, res) => {
  try {
    let govt = req.session.govt;
    const feedbacks = await govtHelper.getAllFeedbacks(govt.Department,govt.Email);
  
    res.render("govt/all-feedbacks", { govt: true,layout: "layout",govt, feedbacks });
  } catch (error) {
    console.error("Error fetching feedback", error);
    res.status(500).send("Internal Server Error");
  }
});


////////document-resolutions

router.get("/document-resolutions", verifySignedIn,async function (req, res) {
  let govt = req.session.govt;
  let complaints = await govtHelper.getAllComplaintRecords();
  res.render("govt/document-resolutions", { govt: true, layout: "layout-documents",complaints, govt });
});


router.get("/complaint-record/:id", async (req, res) => {
  let complaint = await govtHelper.getComplaintRecord(req.params.id);
  res.render("govt/view-complaint", { layout: "govt-layout", complaint });
});
///////ADD notification/////////////////////                                         
router.get("/add-notification", verifySignedIn, function (req, res) {
  let govt = req.session.govt;
  res.render("govt/all-notifications", { govt: true, layout: "layout", govt });
});

///////ADD notification/////////////////////                                         
router.post("/add-notification", function (req, res) {
  govtHelper.addnotification(req.body, (id) => {
    res.redirect("/govt/all-notifications");
  });
});

router.get("/delete-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  adminHelper.deletenotification(notificationId).then((response) => {
    res.redirect("/govt/all-notifications");
  });
});

///////EDIT notification/////////////////////                                         
router.get("/edit-notification/:id", verifySignedIn, async function (req, res) {
  let govt = req.session.govt;
  let notificationId = req.params.id;
  let notification = await govtHelper.getnotificationDetails(notificationId);
  console.log(notification);
  res.render("govt/edit-notification", { govt: true, layout: "layout", notification, govt });
});

///////EDIT notification/////////////////////                                         
router.post("/edit-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  govtHelper.updatenotification(notificationId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/notification-images/" + notificationId + ".png");
      }
    }
    res.redirect("/govt/all-notifications");
  });
});

///////DELETE notification/////////////////////                                         
router.get("/delete-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  govtHelper.deletenotification(notificationId).then((response) => {
    res.redirect("/govt/all-notifications");
  });
});

///////DELETE ALL notification/////////////////////                                         
router.get("/delete-all-notifications", verifySignedIn, function (req, res) {
  govtHelper.deleteAllnotifications().then(() => {
    res.redirect("/govt/all-notifications");
  });
});


////////////////////PROFILE////////////////////////////////////
router.get("/profile", async function (req, res, next) {
  let govt = req.session.govt;
  res.render("govt/profile", { govt: true, layout: "layout", govt });
});


router.get("/pending-approval", function (req, res) {
  if (!req.session.signedInGovt || req.session.govt.approved) {
    res.redirect("/govt");
  } else {
    res.render("govt/pending-approval", {
      govt: true, layout: "empty",
    });
  }
});


router.get("/signup", function (req, res) {
  if (req.session.signedInGovt) {
    res.redirect("/govt");
  } else {
    res.render("govt/signup", {
      govt: true, layout: "empty",
      signUpErr: req.session.signUpErr,
    });
  }
});

router.post("/signup", async function (req, res) {
  const { Name, Email, Phone, Address, Department, Designation, Password } = req.body;
  let errors = {};

  // Field validations
  if (!Name) errors.name = "Please enter your name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Phone) errors.phone = "Please enter your phone number.";
  if (!Address) errors.address = "Please enter your address.";
  if (!Department) errors.city = "Please enter your Department.";
  if (!Designation) errors.pincode = "Please enter your designation.";
  if (!Password) errors.password = "Please enter a password.";

  // Check if email or company name already exists
  const existingEmail = await db.get()
    .collection(collections.GOVT_COLLECTION)
    .findOne({ Email });
  if (existingEmail) errors.email = "This email is already registered.";

  const existingCompanyname = await db.get()
    .collection(collections.GOVT_COLLECTION)
    .findOne({ Name });
//   if (existingCompanyname) errors.Companyname = "This company name is already registered.";

  // Validate Pincode and Phone
//   if (!/^\d{6}$/.test(Pincode)) errors.pincode = "Pincode must be exactly 6 digits.";
  if (!/^\d{10}$/.test(Phone)) errors.phone = "Phone number must be exactly 10 digits.";
  const existingPhone = await db.get()
    .collection(collections.GOVT_COLLECTION)
    .findOne({ Phone });
  if (existingPhone) errors.phone = "This phone number is already registered.";

  // If there are validation errors, re-render the form
  if (Object.keys(errors).length > 0) {
    return res.render("govt/signup", {
      govt: true,
      layout: 'empty',
      errors,
      Name,
      Email,
      Phone,
      Address,
      Department, Designation,
      Password
    });
  }

  govtHelper.dosignup(req.body).then((response) => {
    if (!response) {
      req.session.signUpErr = "Invalid Admin Code";
      return res.redirect("/govt/signup");
    }

    // Extract the id properly, assuming it's part of an object (like MongoDB ObjectId)
    const id = response._id ? response._id.toString() : response.toString();
    res.redirect("/govt/signin")

    // Ensure the images directory exists
    // const imageDir = "./public/images/govt-images/";
    // if (!fs.existsSync(imageDir)) {
    //   fs.mkdirSync(imageDir, { recursive: true });
    // }

    // Handle image upload
    // if (req.files && req.files.Image) {
    //   let image = req.files.Image;
    //   let imagePath = imageDir + id + ".png";  // Use the extracted id here

    //   console.log("Saving image to:", imagePath);  // Log the correct image path

    //   image.mv(imagePath, (err) => {
    //     if (!err) {
    //       // On successful image upload, redirect to pending approval
    //       req.session.signedInGovt = true;
    //       req.session.govt = response;
    //       res.redirect("/govt/pending-approval");
    //     } else {
    //       console.log("Error saving image:", err);  // Log any errors
    //       res.status(500).send("Error uploading image");
    //     }
    //   });
    // } else {
    //   // No image uploaded, proceed without it
    //   req.session.signedInGovt = true;
    //   req.session.govt = response;
    //   res.redirect("/govt/pending-approval");
    // }
  }).catch((err) => {
    console.log("Error during signup:", err);
    res.status(500).send("Error during signup");
  });
}),


  router.get("/signin", function (req, res) {
    if (req.session.signedInGovt) {
      res.redirect("/govt");
    } else {
      res.render("govt/signin", {
        govt: true, layout: "empty",
        signInErr: req.session.signInErr,
      });
      req.session.signInErr = null;
    }
  });

router.post("/signin", function (req, res) {
  const { Email, Password } = req.body;

  // Validate Email and Password
  if (!Email || !Password) {
    req.session.signInErr = "Please fill all fields.";
    return res.redirect("/govt/signin");
  }

  govtHelper.doSignin(req.body)
    .then((response) => {
      if (response.status === true) {
        req.session.signedInGovt = true;
        req.session.govt = response.govt;
        res.redirect("/govt/home");
      } else if (response.status === "pending") {
        req.session.signInErr = "This user is not approved by admin, please wait.";
        res.redirect("/govt/signin");
      } else if (response.status === "rejected") {
        req.session.signInErr = "This user is rejected by admin.";
        res.redirect("/govt/signin");
      } else {
        req.session.signInErr = "Invalid Email/Password";
        res.redirect("/govt/signin");
      }
    })
    .catch((error) => {
      console.error(error);
      req.session.signInErr = "An error occurred. Please try again.";
      res.redirect("/govt/signin");
    });
});




router.get("/signout", function (req, res) {
  req.session.signedInGovt = false;
  req.session.govt = null;
  res.redirect("/govt");
});
router.post("/search", verifySignedIn, function (req, res) {
  let govt = req.session.govt;
  govtHelper.searchProduct(req.body).then((response) => {
    res.render("govt/search-result", { govt: true, layout: "layout", govt, response });
  });
});


module.exports = router;
