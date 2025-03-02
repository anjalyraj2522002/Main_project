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
///////ADD workspace/////////////////////                                         
  addComplaint:async (complaint, callback) => {
    
    const complaintId = await getNextComplaintId();
    complaint.complaintId = complaintId; // Assign generated ID
    
    db.get()
      .collection(collections.COMPLAINTS_COLLECTION)
      .insertOne(complaint)
      .then((data) => {
        console.log("cmp addes%%%%%:",data.insertedId)
        callback(data.insertedId.toString());
        //callback(data.ops[0]._id); // Return the inserted workspace ID
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
          .toArray();

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




  getFeedbackByWorkspaceId: (workspaceId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const feedbacks = await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .find({ workspaceId: ObjectId(workspaceId) }) // Convert workspaceId to ObjectId
          .toArray();

        resolve(feedbacks);
      } catch (error) {
        reject(error);
      }
    });
  },


  getBuilderById: (builderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const builder = await db.get()
          .collection(collections.BUILDER_COLLECTION)
          .findOne({ _id: ObjectId(builderId) });
        resolve(builder);
      } catch (error) {
        reject(error);
      }
    });
  },








  ///////GET ALL workspace/////////////////////     

  getAllworkspaces: () => {
    return new Promise(async (resolve, reject) => {
      let workspaces = await db
        .get()
        .collection(collections.WORKSPACE_COLLECTION)
        .find()
        .toArray();
      resolve(workspaces);
    });
  },

  getWorkspaceById: (workspaceId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const workspace = await db.get()
          .collection(collections.WORKSPACE_COLLECTION)
          .findOne({ _id: ObjectId(workspaceId) }); // Convert workspaceId to ObjectId
        resolve(workspace);
      } catch (error) {
        reject(error);
      }
    });
  },

  // getAllworkspaces: (builderId) => {
  //   return new Promise(async (resolve, reject) => {
  //     let workspaces = await db
  //       .get()
  //       .collection(collections.WORKSPACE_COLLECTION)
  //       .find({ builderId: ObjectId(builderId) }) // Filter by builderId
  //       .toArray();
  //     resolve(workspaces);
  //   });
  // },

  /////// workspace DETAILS/////////////////////                                            
  getworkspaceDetails: (workspaceId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .findOne({
          _id: ObjectId(workspaceId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
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




  getWorkspaceDetails: (workspaceId) => {
    return new Promise((resolve, reject) => {
      if (!ObjectId.isValid(workspaceId)) {
        reject(new Error('Invalid workspace ID format'));
        return;
      }

      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .findOne({ _id: ObjectId(workspaceId) })
        .then((workspace) => {
          if (!workspace) {
            reject(new Error('Workspace not found'));
          } else {
            // Assuming the workspace has a builderId field
            resolve(workspace);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },




  placeOrder: (order, workspace, total, user) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(order, workspace, total);
        let status = order["payment-method"] === "COD" ? "placed" : "pending";

        // Get the workspace document to check the current seat value
        const workspaceDoc = await db.get()
          .collection(collections.WORKSPACE_COLLECTION)
          .findOne({ _id: ObjectId(workspace._id) });

        // Check if the workspace exists and the seat field is present
        if (!workspaceDoc || !workspaceDoc.seat) {
          return reject(new Error("Workspace not found or seat field is missing."));
        }

        // Convert seat from string to number and check availability
        let seatCount = Number(workspaceDoc.seat);
        if (isNaN(seatCount) || seatCount <= 0) {
          return reject(new Error("Seat is not available."));
        }

        // Create the order object
        let orderObject = {
          deliveryDetails: {
            Fname: order.Fname,
            Lname: order.Lname,
            Email: order.Email,
            Phone: order.Phone,
            Address: order.Address,
            District: order.District,
            State: order.State,
            Pincode: order.Pincode,
            selecteddate: order.selecteddate,
          },
          userId: ObjectId(order.userId),
          user: user,
          paymentMethod: order["payment-method"],
          workspace: workspace,
          totalAmount: total,
          status: status,
          date: new Date(),
          builderId: workspace.builderId, // Store the builder's ID
        };

        // Insert the order into the database
        const response = await db.get()
          .collection(collections.ORDER_COLLECTION)
          .insertOne(orderObject);

        // Decrement the seat count
        seatCount -= 1; // Decrement the seat count

        // Convert back to string and update the workspace seat count
        await db.get()
          .collection(collections.WORKSPACE_COLLECTION)
          .updateOne(
            { _id: ObjectId(workspace._id) },
            { $set: { seat: seatCount.toString() } } // Convert number back to string
          );

        resolve(response.ops[0]._id);
      } catch (error) {
        console.error("Error placing order:", error);
        reject(error);
      }
    });
  },


  getUserOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .find({ userId: ObjectId(userId) }) // Use 'userId' directly, not inside 'orderObject'
          .toArray();

        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },

  getOrderWorkspaces: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let workspaces = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .aggregate([
            {
              $match: { _id: ObjectId(orderId) }, // Match the order by its ID
            },
            {
              $project: {
                // Include workspace, user, and other relevant fields
                workspace: 1,
                user: 1,
                paymentMethod: 1,
                totalAmount: 1,
                status: 1,
                date: 1,
                deliveryDetails: 1, // Add deliveryDetails to the projection

              },
            },
          ])
          .toArray();

        resolve(workspaces[0]); // Fetch the first (and likely only) order matching this ID
      } catch (error) {
        reject(error);
      }
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
