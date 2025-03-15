var express = require("express");
var userHelper = require("../helper/userHelper");

var router = express.Router();
var db = require("../config/connection");
const fs = require("fs");
const path = require("path");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;

const verifySignedIn = (req, res, next) => {
  if (req.session.signedIn) {
    next();
  } else {
    res.redirect("/signin");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
    res.render("users/home", { admin: false, user });
});

///////ADD complaint/////////////////////                                         
router.get("/add-complaint", verifySignedIn, function (req, res) {
  let user = req.session.user;
  res.render("users/add-complaint", { user: true, layout: "layout", user });
});
                                         
router.post("/add-complaint", async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect("/signin");
  }

  const { date, subject, desc, department, category, locality, office_address, "attachmentType[]": attachmentTypes,
    applicantId, applicantName, applicantEmail, applicantPhone, applicantPincode} = req.body;

  const complaintData = {
    applicantId,
    applicantName,
    applicantPhone,
    applicantEmail,
    applicantPincode,
    subject,
    desc,
    department,
    category,
    locality,
    office_address,
    date: date,
    status: "Pending",
    attachments: [],
  };

  userHelper.addComplaint(complaintData, async (complaintId, error) => {
    if (error) {
      console.log("Error adding complaint:", error);
      return res.status(500).send("Failed to add complaint");
    }

    // Handle file uploads
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];

      files.forEach((file, index) => {
        let extension = path.extname(file.name).toLowerCase();
        let newFilename = `${complaintId}-${index + 1}`;

        if ([".jpg", ".jpeg", ".png"].includes(extension)) {
          newFilename += ".png";
        } else if ([".mp4", ".avi", ".mov"].includes(extension)) {
          newFilename += ".mp4";
        } else if (extension === ".pdf") {
          newFilename += ".pdf";
        } else {
          return; 
        }

        let uploadPath = path.join(__dirname, "../public/upload/", newFilename);
        file.mv(uploadPath, (err) => {
          if (err) console.log("Error saving file:", err);
        });

        complaintData.attachments.push(newFilename);
      });

      // Update complaint with attached files
      await db.get().collection(collections.COMPLAINTS_COLLECTION).updateOne(
        { complaintId },
        { $set: { attachments: complaintData.attachments } }
      );
    }

    res.redirect("/complaint-placed");
  });
});

router.get("/notifications", verifySignedIn, function (req, res) {
  let user = req.session.user;  // Get logged-in user from session

  // Use the user._id to fetch notifications for the logged-in user
  userHelper.getnotificationById(user._id).then((notifications) => {
    res.render("users/notifications", { admin: false, notifications, user });
  }).catch((err) => {
    console.error("Error fetching notifications:", err);
    res.status(500).send("Error fetching notifications");
  });
});

router.get("/about", async function (req, res) {
  res.render("users/about", { admin: false, });
})


router.get("/contact", async function (req, res) {
  res.render("users/contact", { admin: false, });
})

router.get("/service", async function (req, res) {
  res.render("users/service", { admin: false, });
})

router.get("/rate-complaint/:id", verifySignedIn, async function (req, res, next) {
  let user = req.session.user;
  let id = req.params.id;
  let cmp= await userHelper.getStatusById(id)
  let status=cmp.status;
  res.render("users/rate-complaint", { admin: false, user,id,status });
});

router.post("/rate-complaint", verifySignedIn, async (req, res) => {
  try {
    const { complaintId, rating, username, feedback } = req.body;
    const finalRating = rating ? parseInt(rating) : 0;
 
    const userId = req.session.user._id;
    const cmp= await userHelper.getComplaintDetails(complaintId);
    const department= cmp.department
    const updatedBy=cmp.updatedBy
    const status=cmp.status
    
    await db.get().collection(collections.FEEDBACK_COLLECTION)
      .updateOne(
        { complaintId, userId }, // filter: find a feedback for this complaint by this user
        { $set: {
          complaintId, userId,
            username,
            rating: finalRating,
            feedback,   
            department,
            updatedBy,
            status,        
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    
    res.redirect("/my-complaints")
  } catch (error) {
    console.error("Error rating complaint", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});






////////////////////PROFILE////////////////////////////////////
router.get("/profile", async function (req, res, next) {
  let user = req.session.user;
  res.render("users/profile", { admin: false, user });
});

////////////////////USER TYPE////////////////////////////////////
router.get("/usertype", async function (req, res, next) {
  res.render("users/usertype", { admin: false, layout: 'empty' });
});

router.get("/usertype/signup", async function (req, res, next) {
  res.render("users/usertype-signup", { admin: false, layout: 'empty' });
});





router.get("/signup", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signup", { admin: false, layout: 'empty' });
  }
});

router.post("/signup", async function (req, res) {
  console.log("&&&&&&&&&&&&&&&&",req.body,"")
  const { Fname, Email, Phone, Address, Pincode, District, Password ,aadhar,
    ward,village} = req.body;
  let errors = {};

  // Check if email already exists
  const existingEmail = await db.get()
    .collection(collections.USERS_COLLECTION)
    .findOne({ Email });

  if (existingEmail) {
    errors.email = "This email is already registered.";
  }

  // Validate phone number length and uniqueness

  if (!Phone) {
    errors.phone = "Please enter your phone number.";
  } else if (!/^\d{10}$/.test(Phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  } else if (!/^\d{12}$/.test(aadhar)) {
    errors.aadhar = "Aadhar number must be exactly 12 digits.";
  } 
  else {
    const existingPhone = await db.get()
      .collection(collections.USERS_COLLECTION)
      .findOne({ Phone });

    if (existingPhone) {
      errors.phone = "This phone number is already registered.";
    }
  }
  // Validate Pincode
  if (!Pincode) {
    errors.pincode = "Please enter your pincode.";
  } else if (!/^\d{6}$/.test(Pincode)) {
    errors.pincode = "Pincode must be exactly 6 digits.";
  }

  if (!Fname) errors.fname = "Please enter your first name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Address) errors.address = "Please enter your address.";
  if (!District) errors.district = "Please enter your city.";
  if (!ward) errors.address = "Please enter your ward.";
  if (!village) errors.district = "Please enter your village.";

  // Password validation
  if (!Password) {
    errors.password = "Please enter a password.";
  } else {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!strongPasswordRegex.test(Password)) {
      errors.password = "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render("users/signup", {
      admin: false,
      layout: 'empty',
      errors,
      Fname,
      Email,
      aadhar,
      ward,
      village,
      Phone,
      Address,
      Pincode,
      District,
      Password
    });
  }

  // Proceed with signup
  userHelper.doSignup(req.body).then((response) => {
    req.session.signedIn = true;
    req.session.user = response;
    res.redirect("/");
  }).catch((err) => {
    console.error("Signup error:", err);
    res.status(500).send("An error occurred during signup.");
  });
});


router.get("/signin", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signin", {
      admin: false,
      layout: 'empty',
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});


router.post("/signin", function (req, res) {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    req.session.signInErr = "Please fill in all fields.";
    return res.render("users/signin", {
      admin: false,
      layout: 'empty',
      signInErr: req.session.signInErr,
      email: Email,
      password: Password,
    });
  }

  userHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      // If the user is disabled, display the message
      req.session.signInErr = response.msg || "Invalid Email/Password";
      res.render("users/signin", {
        admin: false,
        layout: 'empty',
        signInErr: req.session.signInErr,
        email: Email
      });
    }
  });
});




router.get("/signout", function (req, res) {
  req.session.signedIn = false;
  req.session.user = null;
  res.redirect("/");
});

router.get("/edit-profile/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  let userProfile = await userHelper.getUserDetails(userId);
  res.render("users/edit-profile", { admin: false, userProfile, user });
});

router.post("/edit-profile/:id", verifySignedIn, async function (req, res) {
  try {
    const { Fname, Lname, Email, Phone, Address, District, Pincode } = req.body;
    let errors = {};

    // Validate first name
    if (!Fname || Fname.trim().length === 0) {
      errors.fname = 'Please enter your first name.';
    }

    if (!District || District.trim().length === 0) {
      errors.district = 'Please enter your first name.';
    }

    // Validate last name
    if (!Lname || Lname.trim().length === 0) {
      errors.lname = 'Please enter your last name.';
    }

    // Validate email format
    if (!Email || !/^\S+@\S+\.\S+$/.test(Email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Validate phone number
    if (!Phone) {
      errors.phone = "Please enter your phone number.";
    } else if (!/^\d{10}$/.test(Phone)) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }


    // Validate pincode
    if (!Pincode) {
      errors.pincode = "Please enter your pincode.";
    } else if (!/^\d{6}$/.test(Pincode)) {
      errors.pincode = "Pincode must be exactly 6 digits.";
    }

    if (!Fname) errors.fname = "Please enter your first name.";
    if (!Lname) errors.lname = "Please enter your last name.";
    if (!Email) errors.email = "Please enter your email.";
    if (!Address) errors.address = "Please enter your address.";
    if (!District) errors.district = "Please enter your district.";

    // Validate other fields as needed...

    // If there are validation errors, re-render the form with error messages
    if (Object.keys(errors).length > 0) {
      let userProfile = await userHelper.getUserDetails(req.params.id);
      return res.render("users/edit-profile", {
        admin: false,
        userProfile,
        user: req.session.user,
        errors,
        Fname,
        Lname,
        Email,
        Phone,
        Address,
        District,
        Pincode,
      });
    }

    // Update the user profile
    await userHelper.updateUserProfile(req.params.id, req.body);

    // Fetch the updated user profile and update the session
    let updatedUserProfile = await userHelper.getUserDetails(req.params.id);
    req.session.user = updatedUserProfile;

    // Redirect to the profile page
    res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).send("An error occurred while updating the profile.");
  }
});


router.post("/verify-payment", async (req, res) => {
  console.log(req.body);
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "Payment Failed" });
    });
});

router.get("/complaint-placed", verifySignedIn, async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  // le = await userHelper.g(userId);
  res.render("users/complaint-placed", { admin: false, user });
});

router.get("/my-complaints", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  // Fetch user orders
  let cmp = await userHelper.getUserComplaint(userId);
  res.render("users/my-complaints", { admin: false, user, cmp});
});
router.get("/view-complaint/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
 let cmpId = req.params.id;
  let cmp = await userHelper.getComplaintDetails(cmpId);
   // console.log(officials,"viewwwwwww")
    res.render("users/view-complaint", { admin: false, user,cmp});
});
router.post("/search", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  // le = await userHelper.g(userId);
  userHelper.searchProduct(req.body).then((response) => {
    res.render("users/search-result", { admin: false, user, response });
  });
});

module.exports = router;
