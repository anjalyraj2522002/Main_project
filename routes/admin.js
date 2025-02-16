var express = require("express");
var adminHelper = require("../helper/adminHelper");
var fs = require("fs");
const userHelper = require("../helper/userHelper");
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

router.post("/assign-complaint", async (req, res) => {
  const { complaintId, officialId } = req.body;
  console.log("in assing ",complaintId, officialId)
  try {
      await adminHelper.assignComplaint(complaintId, officialId);
      res.redirect("/admin")
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

///////ALL builder/////////////////////                                         
router.get("/all-builders", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllbuilders().then((builders) => {
    res.render("admin/builder/all-builders", { admin: true, layout: "admin-layout", builders, administator });
  });
});



router.post("/approve-builder/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.BUILDER_COLLECTION).updateOne(
    { _id: ObjectId(req.params.id) },
    { $set: { approved: true } }
  );
  res.redirect("/admin/all-builders");
});

router.post("/reject-builder/:id", function (req, res) {
  const builderId = req.params.id;
  db.get()
    .collection(collections.BUILDER_COLLECTION)
    .updateOne({ _id: ObjectId(builderId) }, { $set: { approved: false, rejected: true } })
    .then(() => {
      res.redirect("/admin/all-builders");
    })
    .catch((err) => {
      console.error(err);
      res.redirect("/admin/all-builders");
    });
});


router.post("/delete-builder/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.BUILDER_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/all-builders");
});

///////ADD builder/////////////////////                                         
router.get("/add-builder", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/builder/add-builder", { admin: true, layout: "admin-layout", administator });
});

///////ADD builder/////////////////////                                         
router.post("/add-builder", function (req, res) {
  adminHelper.addbuilder(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/builder-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/admin/builder/all-builders");
      } else {
        console.log(err);
      }
    });
  });
});

///////EDIT builder/////////////////////                                         
router.get("/edit-builder/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let builderId = req.params.id;
  let builder = await adminHelper.getbuilderDetails(builderId);
  console.log(builder);
  res.render("admin/builder/edit-builder", { admin: true, layout: "admin-layout", builder, administator });
});

///////EDIT builder/////////////////////                                         
router.post("/edit-builder/:id", verifySignedIn, function (req, res) {
  let builderId = req.params.id;
  adminHelper.updatebuilder(builderId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/builder-images/" + builderId + ".png");
      }
    }
    res.redirect("/admin/builder/all-builders");
  });
});

///////DELETE builder/////////////////////                                         
// router.get("/delete-builder/:id", verifySignedIn, function (req, res) {
//   let builderId = req.params.id;
//   adminHelper.deletebuilder(builderId).then((response) => {
//     res.redirect("/admin/all-builders");
//   });
// });

///////DELETE ALL builder/////////////////////                                         
router.get("/delete-all-builders", verifySignedIn, function (req, res) {
  adminHelper.deleteAllbuilders().then(() => {
    res.redirect("/admin/builder/all-builders");
  });
});

router.get("/all-products", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllProducts().then((products) => {
    res.render("admin/all-products", { admin: true, layout: "admin-layout", products, administator });
  });
});

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

router.get("/add-product", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/add-product", { admin: true, layout: "admin-layout", administator });
});

router.post("/add-product", function (req, res) {
  adminHelper.addProduct(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/product-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/admin/add-product");
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/edit-product/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let productId = req.params.id;
  let product = await adminHelper.getProductDetails(productId);
  console.log(product);
  res.render("admin/edit-product", { admin: true, layout: "admin-layout", product, administator });
});

router.post("/edit-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  adminHelper.updateProduct(productId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/product-images/" + productId + ".png");
      }
    }
    res.redirect("/admin/all-products");
  });
});

router.get("/delete-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  adminHelper.deleteProduct(productId).then((response) => {
    fs.unlinkSync("./public/images/product-images/" + productId + ".png");
    res.redirect("/admin/all-products");
  });
});

router.get("/delete-all-products", verifySignedIn, function (req, res) {
  adminHelper.deleteAllProducts().then(() => {
    res.redirect("/admin/all-products");
  });
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

router.get("/all-orders", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let { fromDate, toDate } = req.query; // Get fromDate and toDate from the query parameters

  try {
    let orders = await adminHelper.getAllOrders(fromDate, toDate); // Pass the date range to the function

    res.render("admin/finance", {
      admin: true,
      layout: "admin-layout",
      administator,
      orders,     // Render the filtered orders
      fromDate,   // Pass back toDate and fromDate to display on the form
      toDate
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Server Error");
  }
});


router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let administator = req.session.admin;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("admin/order-products", {
      admin: true, layout: "admin-layout",
      administator,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  adminHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  adminHelper.cancelOrder(orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  adminHelper.cancelAllOrders().then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.searchProduct(req.body).then((response) => {
    res.render("admin/search-result", { admin: true, layout: "admin-layout", administator, response });
  });
});


module.exports = router;
