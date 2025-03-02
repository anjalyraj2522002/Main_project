var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
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


  ///////ADD notification DETAILS/////////////////////                                            
  getnotificationDetails: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .findOne({
          _id: ObjectId(notificationId)
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
          _id: ObjectId(notificationId)
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
            _id: ObjectId(notificationId)
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



  getFeedbackByBuilderId: (govtId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const feedbacks = await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .find({ govtId: ObjectId(govtId) }) // Convert govtId to ObjectId
          .toArray();
        resolve(feedbacks);
      } catch (error) {
        reject(error);
      }
    });
  },

  ///////ADD workspace/////////////////////                                         
  addworkspace: (workspace, govtId, callback) => {
    if (!govtId || !ObjectId.isValid(govtId)) {
      return callback(null, new Error("Invalid or missing govtId"));
    }

    workspace.Price = parseInt(workspace.Price);
    workspace.govtId = ObjectId(govtId); // Associate workspace with the govt

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
  getAllworkspaces: (govtId) => {
    return new Promise(async (resolve, reject) => {
      let workspaces = await db
        .get()
        .collection(collections.WORKSPACE_COLLECTION)
        .find({ govtId: ObjectId(govtId) }) // Filter by govtId
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
          _id: ObjectId(workspaceId)
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
          _id: ObjectId(workspaceId)
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
            _id: ObjectId(workspaceId)
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
      .collection(collections.COMPLAINTS_COLLECTION)
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
        .collection(collections.COMPLAINTS_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  dosignup: (govtData) => {
    return new Promise(async (resolve, reject) => {
      try {
        govtData.Password = govtData.Password;
        govtData.approved = true; 
        govtData.assignedComplaints=[];
        // Set approved to false initially
        const data = await db.get().collection(collections.GOVT_COLLECTION).insertOne(govtData);
        resolve(data.ops[0]);
      } catch (error) {
        reject(error);
      }
    });
  },


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
          if (govtData.Password == govt.Password) {
            if (govt.approved) {
              console.log("Login Success");
              response.govt = govt;
              response.status = true;
            } else {
              console.log("User not approved");
              response.status = "pending";
            }
          } else {
            console.log("Login Failed - Incorrect Password");
            response.status = false;
          }
          resolve(response);
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
        .collection(collections.COMPLAINTS_COLLECTION)
        .findOne({ _id: ObjectId(productId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .removeOne({ _id: ObjectId(productId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateProduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .updateOne(
          { _id: ObjectId(productId) },
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
        .collection(collections.COMPLAINTS_COLLECTION)
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
        .removeOne({ _id: ObjectId(userId) })
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

  getAllOrders: (govtId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .find({ "govtId": ObjectId(govtId) }) // Filter by govt ID
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
          { _id: ObjectId(orderId) },
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
          .findOne({ _id: ObjectId(orderId) });

        if (!order) {
          return reject(new Error("Order not found."));
        }

        const workspaceId = order.workspace._id; // Get the workspace ID from the order

        // Remove the order from the database
        await db.get()
          .collection(collections.ORDER_COLLECTION)
          .deleteOne({ _id: ObjectId(orderId) });

        // Get the current seat count from the workspace
        const workspaceDoc = await db.get()
          .collection(collections.WORKSPACE_COLLECTION)
          .findOne({ _id: ObjectId(workspaceId) });

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
                { _id: ObjectId(workspaceId) },
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
