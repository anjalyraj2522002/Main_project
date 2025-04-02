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
              assignedTo: ObjectId(Id),
              status: { $ne: "Resolved" } // Exclude resolved complaints
            })
            .sort({ 
              complaintId: -1 
            })
            .toArray()
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
      }).sort({ 
        createdAt: -1 
      })
      .toArray()
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
getAllFeedbacks:(dep,email)=>{
  return new Promise((resolve, reject) => {
        db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .find({
            department: dep,
            updatedBy:email
          })
          .sort({ 
            createdAt: -1 
          })
          .toArray()
          .then((response) => {
            resolve(response);
          });
      });
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
  //reports
  getComplaintsByStatus: async (status, fromDate, toDate, department) => {
    try {
        console.log("%%%%%%%%%%%%%%%%%ppppppppp%%%%%%%%%%%%%", status, fromDate, toDate, department);

        let query = { status: status };

        if (department) {
            query.department = department;
        }

        if (fromDate && toDate) {
            console.log("Filtering by date range");

            // Ensure fromDate and toDate are in the same format as stored in DB
            let formattedFromDate = fromDate + "T00:00";  // Start of the day
            let formattedToDate = toDate + "T23:59";      // End of the day

            query.date = {
                $gte: formattedFromDate,  // Compare as strings
                $lte: formattedToDate
            };
        }

        let complaints = await db.get()
            .collection(collections.COMPLAINTS_COLLECTION)
            .find(query)
            .sort({ 
              complaintId: -1 
            })
            .toArray();

        console.log("%%%%%%%%%%%%%%%%%cccccccccccccc%%%%%%%%%%%%%", complaints);
        return complaints;
    } catch (error) {
        console.error("Error fetching complaints:", error);
        return [];
    }
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
