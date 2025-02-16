var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
<<<<<<< HEAD
const ObjectId = require("mongodb").ObjectID;

module.exports = {

  getAllAssingedComlaints:(Id)=>{
    return new Promise((resolve, reject) => {
          db.get()
            .collection(collections.COMPLAINTS_COLLECTION)
            .find({
              assignedTo: ObjectId(Id)
            }).toArray()
            .then((response) => {
              resolve(response);
            });
        });
  },
  getComplaintDetails: (Id) => {
    return new Promise((resolve, reject) => {
      let query = {};
      // Check if ID is a valid ObjectId
      if (ObjectId.isValid(Id)) {
          query = { _id: new ObjectId(Id) }; // Convert to ObjectId
      } else {
          query = { complaintId: Id }; // Treat as a string ID
      }

      db.get()
          .collection(collections.COMPLAINTS_COLLECTION)
          .findOne(query)
          .then(response => resolve(response))
          .catch(error => reject(error));
  });
    },
    // Fetch officials by matching department
    getOfficialsDetails: (id) => {
      return db.get()
          .collection(collections.GOVT_COLLECTION)
          .findOne({
            _id: ObjectId(id)
          })
  },
  updateComplaintStatus: async (complaintId, status, remarks,govt) => {
    if (!ObjectId.isValid(complaintId)) {
        throw new Error("Invalid Complaint ID");
    }

    return db.get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .updateOne(
            { _id: new ObjectId(complaintId) },
            { $set: { status: status, remarks: remarks, updatedAt: new Date(),updatedBy:govt.Email } }
        );
},
getAllRequestbyGovt:(Id)=>{
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collections.MEETINGS_COLLECTION)
      .find({
        requestedBy: Id
      }).toArray()
      .then((response) => {
        resolve(response);
      });
  });
},
getAllnotifications:(Id)=>{
  return new Promise((resolve, reject) => {
    
    db.get()
      .collection(collections.NOTIFICATIONS_COLLECTION)
      .find({
        userId: ObjectId(Id)
      }).toArray()
      .then((response) => {
        console.log(Id,response,"{{{}}}}}}")
        resolve(response);
      });
  });
},
getAllComplaintRecords:() => {
  return db.get().collection(collections.COMPLAINTS_COLLECTION).find().toArray();
},
getComplaintRecord: (id) => {
  return db.get().collection(collections.COMPLAINTS_COLLECTION).findOne({ _id: objectId(id) });
},
  ///////ADD notification/////////////////////                                         
  addnotification: (notification, callback) => {
    // Convert govtId and userId to ObjectId if they are provided in the notification
    if (notification.govtId) {
      notification.govtId = ObjectId(notification.govtId); // Convert govtId to ObjectId
    }

    if (notification.userId) {
      notification.userId = ObjectId(notification.userId); // Convert userId to ObjectId
=======
const objectId = require("mongodb").ObjectID;

module.exports = {


  ///////ADD notification/////////////////////                                         
  addnotification: (notification, callback) => {
    // Convert builderId and userId to ObjectId if they are provided in the notification
    if (notification.builderId) {
      notification.builderId = objectId(notification.builderId); // Convert builderId to objectId
    }

    if (notification.userId) {
      notification.userId = objectId(notification.userId); // Convert userId to ObjectId
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
    }

    notification.createdAt = new Date(); // Set createdAt as the current date and time

    console.log(notification);  // Log notification to check the changes

    db.get()
      .collection(collections.NOTIFICATIONS_COLLECTION)
      .insertOne(notification)
      .then((data) => {
        console.log(data);  // Log the inserted data for debugging
        callback(data.ops[0]._id);  // Return the _id of the inserted notification
      })
      .catch((err) => {
        console.error("Error inserting notification:", err);
        callback(null, err);  // Pass error back to callback
      });
  },

  ///////GET ALL notification/////////////////////   

<<<<<<< HEAD
  // getAllnotifications: (govtId) => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       // Fetch notifications by govtId and populate user details
  //       let notifications = await db
  //         .get()
  //         .collection(collections.NOTIFICATIONS_COLLECTION)
  //         .aggregate([
  //           // Match notifications by govtId
  //           {
  //             $match: { "govtId": ObjectId(govtId) }
  //           },
  //           // Lookup user details based on userId
  //           {
  //             $lookup: {
  //               from: collections.USERS_COLLECTION, // Assuming your users collection is named 'USERS_COLLECTION'
  //               localField: "userId", // Field in notifications collection
  //               foreignField: "_id", // Field in users collection
  //               as: "userDetails" // Name of the array where the user details will be stored
  //             }
  //           },
  //           // Unwind the userDetails array to get a single document (since $lookup returns an array)
  //           {
  //             $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }
  //           }
  //         ])
  //         .toArray();

  //       resolve(notifications);
  //     } catch (error) {
  //       reject(error);
  //     }
  //   });
  // },
=======
  getAllnotifications: (builderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch notifications by builderId and populate user details
        let notifications = await db
          .get()
          .collection(collections.NOTIFICATIONS_COLLECTION)
          .aggregate([
            // Match notifications by builderId
            {
              $match: { "builderId": objectId(builderId) }
            },
            // Lookup user details based on userId
            {
              $lookup: {
                from: collections.USERS_COLLECTION, // Assuming your users collection is named 'USERS_COLLECTION'
                localField: "userId", // Field in notifications collection
                foreignField: "_id", // Field in users collection
                as: "userDetails" // Name of the array where the user details will be stored
              }
            },
            // Unwind the userDetails array to get a single document (since $lookup returns an array)
            {
              $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }
            }
          ])
          .toArray();

        resolve(notifications);
      } catch (error) {
        reject(error);
      }
    });
  },
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc


  ///////ADD notification DETAILS/////////////////////                                            
  getnotificationDetails: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .findOne({
<<<<<<< HEAD
          _id: ObjectId(notificationId)
=======
          _id: objectId(notificationId)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE notification/////////////////////                                            
  deletenotification: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .removeOne({
<<<<<<< HEAD
          _id: ObjectId(notificationId)
=======
          _id: objectId(notificationId)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE notification/////////////////////                                            
  updatenotification: (notificationId, notificationDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .updateOne(
          {
<<<<<<< HEAD
            _id: ObjectId(notificationId)
=======
            _id: objectId(notificationId)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
          },
          {
            $set: {
              Name: notificationDetails.Name,
              Category: notificationDetails.Category,
              Price: notificationDetails.Price,
              Description: notificationDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL notification/////////////////////                                            
  deleteAllnotifications: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },



<<<<<<< HEAD
  getFeedbackByBuilderId: (govtId) => {
=======
  getFeedbackByBuilderId: (builderId) => {
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
    return new Promise(async (resolve, reject) => {
      try {
        const feedbacks = await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
<<<<<<< HEAD
          .find({ govtId: ObjectId(govtId) }) // Convert govtId to ObjectId
=======
          .find({ builderId: objectId(builderId) }) // Convert builderId to ObjectId
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
          .toArray();
        resolve(feedbacks);
      } catch (error) {
        reject(error);
      }
    });
  },

  ///////ADD workspace/////////////////////                                         
<<<<<<< HEAD
  addworkspace: (workspace, govtId, callback) => {
    if (!govtId || !ObjectId.isValid(govtId)) {
      return callback(null, new Error("Invalid or missing govtId"));
    }

    workspace.Price = parseInt(workspace.Price);
    workspace.govtId = ObjectId(govtId); // Associate workspace with the govt
=======
  addworkspace: (workspace, builderId, callback) => {
    if (!builderId || !objectId.isValid(builderId)) {
      return callback(null, new Error("Invalid or missing builderId"));
    }

    workspace.Price = parseInt(workspace.Price);
    workspace.builderId = objectId(builderId); // Associate workspace with the builder
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc

    db.get()
      .collection(collections.WORKSPACE_COLLECTION)
      .insertOne(workspace)
      .then((data) => {
        callback(data.ops[0]._id); // Return the inserted workspace ID
      })
      .catch((error) => {
        callback(null, error);
      });
  },


  ///////GET ALL workspace/////////////////////                                            
<<<<<<< HEAD
  getAllworkspaces: (govtId) => {
=======
  getAllworkspaces: (builderId) => {
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
    return new Promise(async (resolve, reject) => {
      let workspaces = await db
        .get()
        .collection(collections.WORKSPACE_COLLECTION)
<<<<<<< HEAD
        .find({ govtId: ObjectId(govtId) }) // Filter by govtId
=======
        .find({ builderId: objectId(builderId) }) // Filter by builderId
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        .toArray();
      resolve(workspaces);
    });
  },

  ///////ADD workspace DETAILS/////////////////////                                            
  getworkspaceDetails: (workspaceId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .findOne({
<<<<<<< HEAD
          _id: ObjectId(workspaceId)
=======
          _id: objectId(workspaceId)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE workspace/////////////////////                                            
  deleteworkspace: (workspaceId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .removeOne({
<<<<<<< HEAD
          _id: ObjectId(workspaceId)
=======
          _id: objectId(workspaceId)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE workspace/////////////////////                                            
  updateworkspace: (workspaceId, workspaceDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .updateOne(
          {
<<<<<<< HEAD
            _id: ObjectId(workspaceId)
=======
            _id: objectId(workspaceId)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
          },
          {
            $set: {
              wname: workspaceDetails.wname,
              seat: workspaceDetails.seat,
              Price: workspaceDetails.Price,
              format: workspaceDetails.format,
              desc: workspaceDetails.desc,
              baddress: workspaceDetails.baddress,

            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL workspace/////////////////////                                            
  deleteAllworkspaces: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.WORKSPACE_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },


  addProduct: (product, callback) => {
    console.log(product);
    product.Price = parseInt(product.Price);
    db.get()
<<<<<<< HEAD
      .collection(collections.COMPLAINTS_COLLECTION)
=======
      .collection(collections.PRODUCTS_COLLECTION)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
<<<<<<< HEAD
        .collection(collections.COMPLAINTS_COLLECTION)
=======
        .collection(collections.PRODUCTS_COLLECTION)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        .find()
        .toArray();
      resolve(products);
    });
  },

<<<<<<< HEAD
  dosignup: (govtData) => {
    return new Promise(async (resolve, reject) => {
      try {
        govtData.Password = await bcrypt.hash(govtData.Password, 10);
        govtData.approved = true; 
        govtData.assignedComplaints=[];
        // Set approved to false initially
        const data = await db.get().collection(collections.GOVT_COLLECTION).insertOne(govtData);
=======
  dosignup: (builderData) => {
    return new Promise(async (resolve, reject) => {
      try {
        builderData.Password = await bcrypt.hash(builderData.Password, 10);
        builderData.approved = true; // Set approved to false initially
        const data = await db.get().collection(collections.BUILDER_COLLECTION).insertOne(builderData);
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        resolve(data.ops[0]);
      } catch (error) {
        reject(error);
      }
    });
  },


<<<<<<< HEAD
  doSignin: (govtData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let govt = await db
        .get()
        .collection(collections.GOVT_COLLECTION)
        .findOne({ Email: govtData.Email });
      if (govt) {
        if (govt.rejected) {
          console.log("User is rejected");
          resolve({ status: "rejected" });
        } else {
          bcrypt.compare(govtData.Password, govt.Password).then((status) => {
            if (status) {
              if (govt.approved) {
                console.log("Login Success");
                response.govt = govt;
=======
  doSignin: (builderData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let builder = await db
        .get()
        .collection(collections.BUILDER_COLLECTION)
        .findOne({ Email: builderData.Email });
      if (builder) {
        if (builder.rejected) {
          console.log("User is rejected");
          resolve({ status: "rejected" });
        } else {
          bcrypt.compare(builderData.Password, builder.Password).then((status) => {
            if (status) {
              if (builder.approved) {
                console.log("Login Success");
                response.builder = builder;
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
                response.status = true;
              } else {
                console.log("User not approved");
                response.status = "pending";
              }
              resolve(response);
            } else {
              console.log("Login Failed - Incorrect Password");
              resolve({ status: false });
            }
          });
        }
      } else {
        console.log("Login Failed - Email not found");
        resolve({ status: false });
      }
    });
  },


  getProductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
<<<<<<< HEAD
        .collection(collections.COMPLAINTS_COLLECTION)
        .findOne({ _id: ObjectId(productId) })
=======
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({ _id: objectId(productId) })
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
<<<<<<< HEAD
        .collection(collections.COMPLAINTS_COLLECTION)
        .removeOne({ _id: ObjectId(productId) })
=======
        .collection(collections.PRODUCTS_COLLECTION)
        .removeOne({ _id: objectId(productId) })
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateProduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
<<<<<<< HEAD
        .collection(collections.COMPLAINTS_COLLECTION)
        .updateOne(
          { _id: ObjectId(productId) },
=======
        .collection(collections.PRODUCTS_COLLECTION)
        .updateOne(
          { _id: objectId(productId) },
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
          {
            $set: {
              Name: productDetails.Name,
              Category: productDetails.Category,
              Price: productDetails.Price,
              Description: productDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteAllProducts: () => {
    return new Promise((resolve, reject) => {
      db.get()
<<<<<<< HEAD
        .collection(collections.COMPLAINTS_COLLECTION)
=======
        .collection(collections.PRODUCTS_COLLECTION)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  removeUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
<<<<<<< HEAD
        .removeOne({ _id: ObjectId(userId) })
=======
        .removeOne({ _id: objectId(userId) })
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
        .then(() => {
          resolve();
        });
    });
  },

  removeAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

<<<<<<< HEAD
  getAllOrders: (govtId) => {
=======
  getAllOrders: (builderId) => {
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
<<<<<<< HEAD
          .find({ "govtId": ObjectId(govtId) }) // Filter by govt ID
=======
          .find({ "builderId": objectId(builderId) }) // Filter by builder ID
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
          .sort({ createdAt: -1 })  // Sort by createdAt in descending order
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },

  changeStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
<<<<<<< HEAD
          { _id: ObjectId(orderId) },
=======
          { _id: objectId(orderId) },
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
          {
            $set: {
              "status": status,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  cancelOrder: async (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch the order to get the associated workspace ID
        const order = await db.get()
          .collection(collections.ORDER_COLLECTION)
<<<<<<< HEAD
          .findOne({ _id: ObjectId(orderId) });
=======
          .findOne({ _id: objectId(orderId) });
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc

        if (!order) {
          return reject(new Error("Order not found."));
        }

        const workspaceId = order.workspace._id; // Get the workspace ID from the order

        // Remove the order from the database
        await db.get()
          .collection(collections.ORDER_COLLECTION)
<<<<<<< HEAD
          .deleteOne({ _id: ObjectId(orderId) });
=======
          .deleteOne({ _id: objectId(orderId) });
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc

        // Get the current seat count from the workspace
        const workspaceDoc = await db.get()
          .collection(collections.WORKSPACE_COLLECTION)
<<<<<<< HEAD
          .findOne({ _id: ObjectId(workspaceId) });
=======
          .findOne({ _id: objectId(workspaceId) });
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc

        // Check if the seat field exists and is a string
        if (workspaceDoc && workspaceDoc.seat) {
          let seatCount = Number(workspaceDoc.seat); // Convert seat count from string to number

          // Check if the seatCount is a valid number
          if (!isNaN(seatCount)) {
            seatCount += 1; // Increment the seat count

            // Convert back to string and update the workspace seat count
            await db.get()
              .collection(collections.WORKSPACE_COLLECTION)
              .updateOne(
<<<<<<< HEAD
                { _id: ObjectId(workspaceId) },
=======
                { _id: objectId(workspaceId) },
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
                { $set: { seat: seatCount.toString() } } // Convert number back to string
              );

            resolve(); // Successfully updated the seat count
          } else {
            return reject(new Error("Seat count is not a valid number."));
          }
        } else {
          return reject(new Error("Workspace not found or seat field is missing."));
        }
      } catch (error) {
        console.error("Error canceling order:", error);
        reject(error);
      }
    });
  },


  cancelAllOrders: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  searchProduct: (details) => {
    console.log(details);
    return new Promise(async (resolve, reject) => {
      db.get()
<<<<<<< HEAD
        .collection(collections.COMPLAINTS_COLLECTION)
        .createIndex({ Name: "text" }).then(async () => {
          let result = await db
            .get()
            .collection(collections.COMPLAINTS_COLLECTION)
=======
        .collection(collections.PRODUCTS_COLLECTION)
        .createIndex({ Name: "text" }).then(async () => {
          let result = await db
            .get()
            .collection(collections.PRODUCTS_COLLECTION)
>>>>>>> 2fd49ae9eeb0ded19ffdfc56c750a14f765fbebc
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
