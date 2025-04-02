var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const ObjectId = require("mongodb").ObjectID;
const Razorpay = require("razorpay");



var instance = new Razorpay({
  key_id: "rzp_test_8NokNgt8cA3Hdv",
  key_secret: "xPzG53EXxT8PKr34qT7CTFm9",
});
const getNextComplaintId = async () => {
  const lastComplaint = await db.get().collection(collections.COMPLAINTS_COLLECTION)
    .find().sort({ _id: -1 }).limit(1).toArray();

  let nextId = "cmp01";  // Default for first complaint
  console.log(lastComplaint,"lastComplaint")
  if (lastComplaint.length > 0) {
    const lastId = lastComplaint[0].complaintId; // Example: "cmp09"
    const number = parseInt(lastId.replace("cmp", ""), 10) + 1; // Increment number
    nextId = `cmp${number.toString().padStart(2, "0")}`; // Format as cmpXX
  }else{
    return nextId;
  }
  
  return nextId;
};


module.exports = {
///////ADD /////////////////////                                         
  addComplaint:async (complaint, callback) => {
    
    const complaintId = await getNextComplaintId();
    complaint.complaintId = complaintId; // Assign generated ID
    
    db.get()
      .collection(collections.COMPLAINTS_COLLECTION)
      .insertOne(complaint)
      .then((data) => {
       // console.log("cmp addes%%%%%:",data.insertedId)
        callback(data.insertedId.toString());
      })
      .catch((error) => {
        callback(null, error);
      });
  },

  getUserComplaint: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cmp = await db
          .get()
          .collection(collections.COMPLAINTS_COLLECTION)
          .find({ applicantId: userId }) // Use 'userId' directly, not inside 'orderObject'
          .sort({ 
            complaintId: -1 
          })
          .toArray();

        resolve(cmp);
      } catch (error) {
        reject(error);
      }
    });
  },
  getStatusById: (Id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cmp = await db
          .get()
          .collection(collections.COMPLAINTS_COLLECTION)
          .findOne({ complaintId: Id }) // Use 'userId' directly, not inside 'orderObject'
          console.log(cmp,"lllcmppppp")
        resolve(cmp);
       
      } catch (error) {
        reject(error);
      }
    });
  },

  getnotificationById: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch notifications based on userId (converted to ObjectId)
        const notifications = await db.get()
          .collection(collections.NOTIFICATIONS_COLLECTION)
          .find({ userId: ObjectId(userId) }) // Filter by logged-in userId
          .toArray();

        resolve(notifications);
      } catch (error) {
        reject(error);
      }
    });
  },
  getComplaintDetails: (Id) => {
    console.log(Id, "ftom   ger cmp")
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .findOne({
          complaintId:Id
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  addFeedback: (feedback) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .insertOne(feedback);
        resolve(); // Resolve the promise on success
      } catch (error) {
        reject(error); // Reject the promise on error
      }
    });
  },
getLeaderboard: async () => {
  try {
    const leaderboard = await db.get().collection(collections.COMPLAINTS_COLLECTION)
      .aggregate([
        {
          $group: {
            _id: "$department",
            resolvedCount: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
            underProcessCount: { $sum: { $cond: [{ $ne: ["$status", "Resolved"] }, 1, 0] } },
            totalComplaints: { $sum: 1 }
          }
        },
        {$sort: { resolvedCount: -1, underProcessCount: 1 }} 
      ])
      .toArray();

      leaderboard.forEach((dept, index) => {
        dept.rank = index + 1;
      });

    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error;
  }
},
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Hash the password
        userData.Password =userData.Password;

        // Set default values
        userData.isDisable = false;  // User is not disabled by default
        userData.createdAt = new Date();  // Set createdAt to the current date and time

        // Insert the user into the database
        db.get()
          .collection(collections.USERS_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            // Resolve with the inserted user data
            resolve(data.ops[0]);
          })
          .catch((err) => {
            // Reject with any error during insertion
            reject(err);
          });
      } catch (err) {
        reject(err);  // Reject in case of any error during password hashing
      }
    });
  },

  doSignin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};

      // Find user by email
      let user = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .findOne({ Email: userData.Email });

      // If user exists, check if the account is disabled
      if (user) {
        if (user.isDisable) {
          // If the account is disabled, return the msg from the user collection
          response.status = false;
          response.msg = user.msg || "Your account has been disabled.";
          return resolve(response);
        }

        // Compare passwords
        if(userData.Password==user.Password){
                      console.log("Login Success");
            response.user = user;
            response.status = true;
            resolve(response);  // Successful login
          
        }
       else {
        console.log("Login Failed");
        resolve({ status: false });  // User not found
      }
    } else {
      console.log("Login Failed");
      resolve({ status: false });  // User not found
    }
    });
  },

  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .findOne({ _id: ObjectId(userId) })
        .then((user) => {
          resolve(user);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  updateUserProfile: (userId, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              Fname: userDetails.Fname,
              Lname: userDetails.Lname,
              Email: userDetails.Email,
              Phone: userDetails.Phone,
              Address: userDetails.Address,
              District: userDetails.District,
              Pincode: userDetails.Pincode,
            },
          }
        )
        .then((response) => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },


  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.COMPLAINTS_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .toArray();
      console.log(total[0].total);
      resolve(total[0].total);
    });
  },
  generateRazorpay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("New Order : ", order);
        resolve(order);
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "xPzG53EXxT8PKr34qT7CTFm9");

      hmac.update(
        details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");

      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              "orderObject.status": "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  cancelOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .removeOne({ _id: ObjectId(orderId) })
        .then(() => {
          resolve();
        });
    });
  },

  searchProduct: (details) => {
    console.log(details);
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .createIndex({ Name: "text" }).then(async () => {
          let result = await db
            .get()
            .collection(collections.COMPLAINTS_COLLECTION)
            .find({
              $text: {
                $search: details.search,
              },
            })
            .toArray();
          resolve(result);
        })

    });
  },
};
