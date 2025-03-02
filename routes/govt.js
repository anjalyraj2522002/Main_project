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





///////ALL workspace/////////////////////                                         
// router.get("/all-feedbacks", verifySignedIn, async function (req, res) {
//   let govt = req.session.govt;

//   const workspaceId = req.params.id;

//   console.log('workspace')

//   try {
//     const workspace = await userHelper.getWorkspaceById(workspaceId);
//     const feedbacks = await userHelper.getFeedbackByWorkspaceId(workspaceId); // Fetch feedbacks for the specific workspace
//     console.log('feedbacks', feedbacks)
//     res.render("govt/all-feedbacks", { govt: true, layout: "layout", workspace, feedbacks, govt });
//   } catch (error) {
//     console.error("Error fetching workspace:", error);
//     res.status(500).send("Server Error");
//   }

// });


router.get("/govt-feedback", async function (req, res) {
  let govt = req.session.govt; // Get the govt from session

  if (!govt) {
    return res.status(403).send("Builder not logged in");
  }

  try {
    // Fetch feedback for this govt
    const feedbacks = await govtHelper.getFeedbackByBuilderId(govt._id);

    // Fetch workspace details for each feedback
    const feedbacksWithWorkspaces = await Promise.all(feedbacks.map(async feedback => {
      const workspace = await userHelper.getWorkspaceById(ObjectId(feedback.workspaceId)); // Convert workspaceId to ObjectId
      if (workspace) {
        feedback.workspaceName = workspace.name; // Attach workspace name to feedback
      }
      return feedback;
    }));

    // Render the feedback page with govt, feedbacks, and workspace data
    res.render("govt/all-feedbacks", {
      govt,  // Builder details
      feedbacks: feedbacksWithWorkspaces // Feedback with workspace details
    });
  } catch (error) {
    console.error("Error fetching feedback and workspaces:", error);
    res.status(500).send("Server Error");
  }
});



///////ALL workspace/////////////////////                                         
router.get("/all-workspaces", verifySignedIn, function (req, res) {
  let govt = req.session.govt;
  govtHelper.getAllworkspaces(req.session.govt._id).then((workspaces) => {
    res.render("govt/all-workspaces", { govt: true, layout: "layout", workspaces, govt });
  });
});

///////ADD workspace/////////////////////                                         
router.get("/add-workspace", verifySignedIn, function (req, res) {
  let govt = req.session.govt;
  res.render("govt/add-workspace", { govt: true, layout: "layout", govt });
});

///////ADD workspace/////////////////////                                         
router.post("/add-workspace", function (req, res) {
  // Ensure the govt is signed in and their ID is available
  if (req.session.signedInGovt && req.session.govt && req.session.govt._id) {
    const govtId = req.session.govt._id; // Get the govt's ID from the session

    // Pass the govtId to the addworkspace function
    govtHelper.addworkspace(req.body, govtId, (workspaceId, error) => {
      if (error) {
        console.log("Error adding workspace:", error);
        res.status(500).send("Failed to add workspace");
      } else {
        let image = req.files.Image;
        image.mv("./public/images/workspace-images/" + workspaceId + ".png", (err) => {
          if (!err) {
            res.redirect("/govt/all-workspaces");
          } else {
            console.log("Error saving workspace image:", err);
            res.status(500).send("Failed to save workspace image");
          }
        });
      }
    });
  } else {
    // If the govt is not signed in, redirect to the sign-in page
    res.redirect("/govt/signin");
  }
});


///////EDIT workspace/////////////////////                                         
router.get("/edit-workspace/:id", verifySignedIn, async function (req, res) {
  let govt = req.session.govt;
  let workspaceId = req.params.id;
  let workspace = await govtHelper.getworkspaceDetails(workspaceId);
  console.log(workspace);
  res.render("govt/edit-workspace", { govt: true, layout: "layout", workspace, govt });
});

///////EDIT workspace/////////////////////                                         
router.post("/edit-workspace/:id", verifySignedIn, function (req, res) {
  let workspaceId = req.params.id;
  govtHelper.updateworkspace(workspaceId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/workspace-images/" + workspaceId + ".png");
      }
    }
    res.redirect("/govt/all-workspaces");
  });
});

///////DELETE workspace/////////////////////                                         
router.get("/delete-workspace/:id", verifySignedIn, function (req, res) {
  let workspaceId = req.params.id;
  govtHelper.deleteworkspace(workspaceId).then((response) => {
    fs.unlinkSync("./public/images/workspace-images/" + workspaceId + ".png");
    res.redirect("/govt/all-workspaces");
  });
});

///////DELETE ALL workspace/////////////////////                                         
router.get("/delete-all-workspaces", verifySignedIn, function (req, res) {
  govtHelper.deleteAllworkspaces().then(() => {
    res.redirect("/govt/all-workspaces");
  });
});


router.get("/all-users", verifySignedIn, async function (req, res) {
  let govt = req.session.govt;

  // Ensure you have the govt's ID available
  let govtId = govt._id; // Adjust based on how govt ID is stored in session

  // Pass govtId to getAllOrders
  let orders = await govtHelper.getAllOrders(govtId);

  res.render("govt/all-users", {
    govt: true,
    layout: "layout",
    orders,
    govt
  });
});

router.get("/all-transactions", verifySignedIn, async function (req, res) {
  let govt = req.session.govt;

  // Ensure you have the govt's ID available
  let govtId = govt._id; // Adjust based on how govt ID is stored in session

  // Pass govtId to getAllOrders
  let orders = await govtHelper.getAllOrders(govtId);

  res.render("govt/all-transactions", {
    govt: true,
    layout: "layout",
    orders,
    govt
  });
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

router.get("/add-product", verifySignedIn, function (req, res) {
  let govt = req.session.govt;
  res.render("govt/add-product", { govt: true, layout: "layout", workspace });
});

router.post("/add-product", function (req, res) {
  govtHelper.addProduct(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/product-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/govt/add-product");
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/edit-product/:id", verifySignedIn, async function (req, res) {
  let govt = req.session.govt;
  let productId = req.params.id;
  let product = await govtHelper.getProductDetails(productId);
  console.log(product);
  res.render("govt/edit-product", { govt: true, layout: "layout", product, workspace });
});

router.post("/edit-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  govtHelper.updateProduct(productId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/product-images/" + productId + ".png");
      }
    }
    res.redirect("/govt/all-products");
  });
});

router.get("/delete-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  govtHelper.deleteProduct(productId).then((response) => {
    fs.unlinkSync("./public/images/product-images/" + productId + ".png");
    res.redirect("/govt/all-products");
  });
});

router.get("/delete-all-products", verifySignedIn, function (req, res) {
  govtHelper.deleteAllProducts().then(() => {
    res.redirect("/govt/all-products");
  });
});

router.get("/all-users", verifySignedIn, function (req, res) {
  let govt = req.session.govt;
  govtHelper.getAllUsers().then((users) => {
    res.render("govt/users/all-users", { govt: true, layout: "layout", workspace, users });
  });
});

router.get("/remove-user/:id", verifySignedIn, function (req, res) {
  let userId = req.params.id;
  govtHelper.removeUser(userId).then(() => {
    res.redirect("/govt/all-users");
  });
});

router.get("/remove-all-users", verifySignedIn, function (req, res) {
  govtHelper.removeAllUsers().then(() => {
    res.redirect("/govt/all-users");
  });
});

router.get("/all-orders", verifySignedIn, async function (req, res) {
  let govt = req.session.govt;

  // Ensure you have the govt's ID available
  let govtId = govt._id; // Adjust based on how govt ID is stored in session

  // Pass govtId to getAllOrders
  let orders = await govtHelper.getAllOrders(govtId);

  res.render("govt/all-orders", {
    govt: true,
    layout: "layout",
    orders,
    govt
  });
});

router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let govt = req.session.govt;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("govt/order-products", {
      govt: true, layout: "layout",
      workspace,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  govtHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/govt/all-orders");
  });
});

router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  govtHelper.cancelOrder(orderId).then(() => {
    res.redirect("/govt/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  govtHelper.cancelAllOrders().then(() => {
    res.redirect("/govt/all-orders");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let govt = req.session.govt;
  govtHelper.searchProduct(req.body).then((response) => {
    res.render("govt/search-result", { govt: true, layout: "layout", workspace, response });
  });
});


module.exports = router;
