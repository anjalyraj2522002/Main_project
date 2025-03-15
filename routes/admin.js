var express = require("express");
var adminHelper = require("../helper/adminHelper");
var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;

const verifySignedIn = (req, res, next) => {
  if (req.session.signedInAdmin) {
    next();
  } else {
    res.redirect("/admin/signin");
  }
};

/* GET admins listing. */
router.get("/", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllPendingComplaints().then((cmp) => {
    let count = cmp ? cmp.length : 0; 
    res.render("admin/home", { admin: true, cmp, layout: "admin-layout", administator,count });
  });
});
router.get("/home", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllPendingComplaints().then((cmp) => {
    let count = cmp ? cmp.length : 0; 
    res.render("admin/home", { admin: true, cmp, layout: "admin-layout", administator,count });
  });
});

router.get("/complaint-assigned", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllAssignedComplaints().then((cmp) => {
    let count = cmp ? cmp.length : 0; 
    console.log(cmp)
    res.render("admin/complaint-assigned", { admin: true, cmp, layout: "admin-layout", count,administator });
  });
});
router.get("/complaint-progress", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllUnderProcessComplaints().then((cmp) => {
    let count = cmp ? cmp.length : 0; 
    console.log(cmp)
    res.render("admin/complaint-progress", { admin: true, cmp, layout: "admin-layout",count, administator });
  });
});
router.get("/complaint-resolved", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllResolvedComplaints().then((cmp) => {
    let count = cmp ? cmp.length : 0; 
    console.log(cmp)
    res.render("admin/complaint-resolved", { admin: true, cmp, layout: "admin-layout", administator,count });
  });
});
router.get("/complaint-rejected", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllRejectedComplaints().then((cmp) => {
    console.log(cmp)
    let count = cmp ? cmp.length : 0; 
    res.render("admin/complaint-rejected", { admin: true, cmp, layout: "admin-layout",count, administator });
  });
});


router.get("/view-cmp/:id", verifySignedIn,async function (req, res, next) {
  let administator = req.session.admin;
  let cmpId = req.params.id;
  let cmp = await adminHelper.getComplaintDetails(cmpId);
  let officials = await adminHelper.getOfficialsByDepartment(cmp.department); 
   // console.log(officials,"viewwwwwww")
    res.render("admin/view-complaint", { admin: true, cmp, officials, layout: "admin-layout", administator });
});
router.get("/view-cmps/:id", verifySignedIn,async function (req, res, next) {
  let administator = req.session.admin;
  let cmpId = req.params.id;
  let cmp = await adminHelper.getComplaintDetails(cmpId);
  let officials = await adminHelper.getOfficialsByDepartment(cmp.department); 
   // console.log(officials,"viewwwwwww")
    res.render("admin/view-cmps", { admin: true, cmp, officials, layout: "admin-layout", administator });
});


router.post("/assign-complaint", async (req, res) => {
  const { complaintId, officialId } = req.body;
  console.log("in assing ",complaintId, officialId)
  try {
      await adminHelper.assignComplaint(complaintId, officialId);
      res.json({ success: true, message: error.message });
  } catch (error) {
      console.error("Error assigning complaint:", error);
      res.json({ success: false, message: error.message });
  }
});
router.get("/manage-meeting",verifySignedIn,async (req,res)=>{
  let administator = req.session.admin;
  adminHelper.getAllMeetings().then((meetings) => {
    res.render("admin/manage-meeting", { admin: true, meetings, layout: "admin-layout", administator });
  });
})
router.get("/meeting-approved",verifySignedIn,async (req,res)=>{
  let administator = req.session.admin;
  adminHelper.getAllAprrovedMeetings().then((meetings) => {
    res.render("admin/meeting-approved", { admin: true, meetings, layout: "admin-layout", administator });
  });
})
router.get("/complaint-approved",verifySignedIn,async (req,res)=>{
  let administator = req.session.admin;
  adminHelper.getAllAprrovedMeetings().then((meetings) => {
    res.render("admin/meeting-approved", { admin: true, meetings, layout: "admin-layout", administator });
  });
})
router.get("/meeting-rejected",verifySignedIn,async (req,res)=>{
  let administator = req.session.admin;
  adminHelper.getAllRejectedMeetings().then((meetings) => {
    res.render("admin/meeting-rejected", { admin: true, meetings, layout: "admin-layout", administator });
  });
})
router.post("/set-meeting", async (req, res) => {
  console.log("setttttttttttt",req.body,"ttt&&&&&")
  try {
      let { meetingId, scheduledTime, status } = req.body;

      if (!meetingId || !scheduledTime || !status) {
          return res.status(400).json({ success: false, message: "All fields are required" });
      }

      let meeting = await db.get().collection(collections.MEETINGS_COLLECTION).findOne({ _id: ObjectId(meetingId) });

      if (!meeting) {
          return res.status(404).json({ success: false, message: "Meeting not found" });
      }

      await db.get().collection(collections.MEETINGS_COLLECTION).updateOne(
          { _id: ObjectId(meetingId) },
          { $set: { scheduledTime, status } }
      );

      // Notify Government Official
      await adminHelper.sendNotification(meeting.requestedBy, `Your meeting is scheduled on ${scheduledTime}. Status: ${status}`);

      // Notify All Relevant Departments
      let departmentOfficials = await db.get().collection(collections.GOVT_COLLECTION).find({
          Department: { $in: meeting.departments }
      }).toArray();

      departmentOfficials.forEach(async (official) => {
          await adminHelper.sendNotification(official._id, `A meeting for ${meeting.departments.join(", ")} is scheduled on ${scheduledTime}.`);
      });

      res.json({ success: true, message: "Meeting updated successfully!" });
  } catch (error) {
      console.error("Error updating meeting:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


router.get("/all-notifications", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let notifications = await adminHelper.getAllnotifications();
  res.render("admin/all-notifications", { admin: true, layout: "admin-layout", administator, notifications });
});

///reports
router.get("/reports", verifySignedIn,async function (req, res, next) {
   let administator = req.session.admin;
    res.render("admin/reports", { admin: true, layout: "admin-layout", administator,});
});
router.get("/pending-report",verifySignedIn, async (req, res) => {
 
   let administator = req.session.admin;
  let { fromDate, toDate } = req.query;
  let complaints = await adminHelper.getComplaintsByStatus("Pending", fromDate, toDate);
  res.render("admin/report-view", { admin: true, layout: "admin-layout", administator, complaints, title: "Pending Review Complaints" });
});
router.get("/under-process-report",verifySignedIn, async (req, res) => {
 
   let administator = req.session.admin;
  let { fromDate, toDate } = req.query;
  let complaints = await adminHelper.getComplaintsByStatus("Under Process", fromDate, toDate);
  res.render("admin/report-view", { admin: true, layout: "admin-layout", administator, complaints, title: "Pending Review Complaints" });
});
router.get("/pending-report",verifySignedIn, async (req, res) => {
 
   let administator = req.session.admin;
  let { fromDate, toDate } = req.query;
  let complaints = await adminHelper.getComplaintsByStatus("Pending", fromDate, toDate);
  res.render("admin/report-view", { admin: true, layout: "admin-layout", administator, complaints, title: "Under Process Complaints" });
});
router.get("/rejected-report",verifySignedIn, async (req, res) => {
 
   let administator = req.session.admin;
  let { fromDate, toDate } = req.query;
  let complaints = await adminHelper.getComplaintsByStatus("Rejected", fromDate, toDate);
  res.render("admin/report-view", { admin: true, layout: "admin-layout", administator, complaints, title: "Rejected Complaints" });
});

router.get("/resolved-report",verifySignedIn, async (req, res) => {
 
 
  let administator = req.session.admin;
  let { fromDate, toDate } = req.query;
  let complaints = await adminHelper.getComplaintsByStatus("Resolved", fromDate, toDate);
  res.render("admin/report-view", { admin: true, layout: "admin-layout", administator, complaints, title: "Resolved Complaints" });
});

router.get("/feedback", verifySignedIn, async (req, res) => {
  try {
    
   let administator = req.session.admin;
    const feedbacks = await adminHelper.getAllFeedbacks();
  
    res.render("admin/all-feedbacks", { admin: true, layout: "admin-layout", administator, feedbacks });
  } catch (error) {
    console.error("Error fetching feedback", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/leaderboard", async (req, res) => {
  let administator = req.session.admin;
  try {
    const leaderboard = await adminHelper.getLeaderboard();
    res.render("admin/leaderboard", {admin: true, layout: "admin-layout", administator,  leaderboard });
  } catch (error) {
    res.status(500).send("Error loading leaderboard");
  }
});

router.get("/department-complaints/:department", async (req, res) => {
  try {
    let administator = req.session.admin;
      const { department } = req.params;
      const { status } = req.query; // Get status filter from query params

      const complaints = await adminHelper.getDepartmentComplaints(department, status || "All");

      res.render("admin/department-complaints", { admin: true, layout: "admin-layout", administator,complaints, department, status: status || "All" });
  } catch (error) {
      console.error("Error fetching department complaints:", error);
      res.status(500).send("Internal Server Error");
  }
});

///////ADD reply/////////////////////                                         
router.get("/add-notification", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let users = await adminHelper.getAllUsers();
  res.render("admin/add-notification", { admin: true, layout: "admin-layout", administator, users });
});

///////ADD notification/////////////////////                                         
router.post("/add-notification", function (req, res) {
  adminHelper.addnotification(req.body, (id) => {
    res.redirect("/admin/all-notifications");
  });
});

router.get("/delete-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  adminHelper.deletenotification(notificationId).then((response) => {
    res.redirect("/admin/all-notifications");
  });
});

////////////////////////////                                         
router.get("/signup", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signup", {
      admin: true, layout: "admin-empty",
      signUpErr: req.session.signUpErr,
    });
  }
});

router.post("/signup", function (req, res) {
  adminHelper.doSignup(req.body).then((response) => {
    console.log(response);
    if (response.status == false) {
      req.session.signUpErr = "Invalid Admin Code";
      res.redirect("/admin/signup");
    } else {
      req.session.signedInAdmin = true;
      req.session.admin = response;
      res.redirect("/admin");
    }
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signin", {
      admin: true, layout: "admin-empty",
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
  adminHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedInAdmin = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.redirect("/admin/signin");
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedInAdmin = false;
  req.session.admin = null;
  res.redirect("/admin");
});


router.get("/all-users", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllUsers().then((users) => {
    res.render("admin/users/all-users", { admin: true, layout: "admin-layout", administator, users });
  });
});

router.post("/block-user/:id", (req, res) => {
  const userId = req.params.id;
  const { reason } = req.body;

  // Update the user in the database to set isDisable to true and add the reason
  db.get()
    .collection(collections.USERS_COLLECTION)
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isDisable: true, blockReason: reason } }
    )
    .then(() => res.json({ success: true }))
    .catch(err => {
      console.error('Error blocking user:', err);
      res.json({ success: false });
    });
});



router.get("/remove-all-users", verifySignedIn, function (req, res) {
  adminHelper.removeAllUsers().then(() => {
    res.redirect("/admin/all-users");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.searchProduct(req.body).then((response) => {
    res.render("admin/search-result", { admin: true, layout: "admin-layout", administator, response });
  });
});


module.exports = router;
