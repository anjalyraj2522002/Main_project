var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;


module.exports = {
  getAllComplaints: () => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .find()
        .sort({ 
          complaintId: -1 
        })
        .toArray();
      resolve(result);
    });
  },
  getAllFeedbacks:()=>{
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.FEEDBACK_COLLECTION)
        .find()
        .sort({ 
          createdAt: -1 // Sorting in descending order
        })
        .toArray();
      resolve(result);
    });

  },
  getAllPendingComplaints:() => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .find({status:"Pending"})
        .sort({ 
          complaintId: -1 // Sorting in descending order
        })
        .toArray();
      resolve(result);
    });
  },
  getAllUnderProcessComplaints:() => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .find({status:"Under Process"})
        .sort({ 
          complaintId: -1 
        })
        .toArray();
      resolve(result);
    });
  },
  getAllResolvedComplaints:() => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .find({status:"Resolved"})
        .sort({ 
          complaintId: -1 
        })
        .toArray();
      resolve(result);
    });
  },
  getAllRejectedComplaints:() => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .find({status:"Rejected"})
        .sort({ 
          complaintId: -1 
        })
        .toArray();
      resolve(result);
    });
  },

  getAllAssignedComplaints:() => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .find({status:"Assigned"})
        .sort({ 
          complaintId: -1 
        })
        .toArray();
      resolve(result);
    });
  },
   ///////VIEW DETAILS/////////////////////                                            
   getComplaintDetails: (Id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .findOne({
          _id: objectId(Id)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },
    //reports
    getComplaintsByStatus: async (status, fromDate, toDate) => {
      try {
          console.log("%%%%%%%%%%%%%%%%%ppppppppp%%%%%%%%%%%%%", status, fromDate, toDate);
  
          let query = { status: status };

  
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
  // Fetch officials by matching department
  getOfficialsByDepartment: (department) => {
    console.log("dept:",department)
    return db.get()
        .collection(collections.GOVT_COLLECTION)
        .find({ Department: department, approved: true }) // Match department & approved officials
        .toArray();
},

// Assign complaint to an official
assignComplaint: (complaintId, officialId) => {
    return db.get()
        .collection(collections.COMPLAINTS_COLLECTION)
        .updateOne(
            { complaintId: complaintId },
            { $set: { assignedTo: objectId(officialId), status: "Assigned" } }
        )
        .then(() => {
          console.log("in helper  ",complaintId, officialId)
            return db.get()
                .collection(collections.GOVT_COLLECTION)
                .updateOne(
                    { _id: objectId(officialId) },
                    { $push: { assignedComplaints: complaintId } } // Add complaint to official's list
                );
        });
},
getAllMeetings:()=>{
  return new Promise(async (resolve, reject) => {
    let result = await db
      .get()
      .collection(collections.MEETINGS_COLLECTION)
      .find({status:"Pending"})
      .sort({ 
        createdAt: -1 
      })
      .toArray();
    resolve(result);
  });

},
getAllRejectedMeetings:()=>{
  return new Promise(async (resolve, reject) => {
    let result = await db
      .get()
      .collection(collections.MEETINGS_COLLECTION)
      .find({status:"Rejected"})
      .sort({ 
        createdAt: -1 
      })
      .toArray();
    resolve(result);
  });

},
getAllAprrovedMeetings:()=>{
  return new Promise(async (resolve, reject) => {
    let result = await db
      .get()
      .collection(collections.MEETINGS_COLLECTION)
      .find({status:"Approved"})
      .sort({ 
        createdAt: -1 
      })
      .toArray();
    resolve(result);
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
getDepartmentComplaints :(department, status) => {
  return new Promise((resolve, reject) => {
      let query = { department };

      if (status && status !== "All") {
          query.status = status;
      }

      db.get()
          .collection(collections.COMPLAINTS_COLLECTION)
          .find(query)
          .sort({ updatedAt: -1 })
          .toArray()
          .then((complaints) => resolve(complaints))
          .catch((err) => reject(err));
  });
},
sendNotification :async (userId, message) => {
  try {
      await db.get().collection(collections.NOTIFICATIONS_COLLECTION).insertOne({
          userId: objectId(userId),
          message,
          seen: false,
          createdAt: new Date()
      });
  } catch (error) {
      console.error("Error sending notification:", error);
  }
},

  ///////ADD builder/////////////////////                                         
  addnotification: (notification, callback) => {
    console.log(notification);

    // Convert userId to objectId if it's present
    if (notification.userId) {
      notification.userId = new objectId(notification.userId);
    }

    // Add createdAt field with the current timestamp
    notification.createdAt = new Date();

    db.get()
      .collection(collections.NOTIFICATIONS_COLLECTION)
      .insertOne(notification)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      })
      .catch((err) => {
        console.error("Error inserting notification:", err);
        callback(null);  // Handle error case by passing null
      });
  },


  ///////GET ALL Notifications/////////////////////                                            
  getAllnotifications: () => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch all notifications and join with users collection to get Fname
        let notifications = await db
          .get()
          .collection(collections.NOTIFICATIONS_COLLECTION)
          .aggregate([
            {
              $lookup: {
                from: collections.USERS_COLLECTION,  // Name of the users collection
                localField: "userId",  // Field in notifications collection (userId)
                foreignField: "_id",  // Field in users collection (_id)
                as: "userDetails",  // Name of the array where user data will be stored
              },
            },
            {
              $unwind: {
                path: "$userDetails",  // Flatten the userDetails array
                preserveNullAndEmptyArrays: true,  // If user not found, keep notification
              },
            },
          ])
          .toArray();

        // Map over the notifications and add user first name (Fname)
        notifications = notifications.map(notification => ({
          ...notification,
          userFname: notification.userDetails ? notification.userDetails.Fname : 'Unknown',  // Fname of user or 'Unknown' if no user found
        }));

        resolve(notifications);
      } catch (err) {
        reject(err);
      }
    });
  },

  deletenotification: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATIONS_COLLECTION)
        .removeOne({
          _id: objectId(notificationId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
 

  doSignup: (adminData) => {
    return new Promise(async (resolve, reject) => {
      if (adminData.Code == "admin123") {
        adminData.Password = await bcrypt.hash(adminData.Password, 10);
        db.get()
          .collection(collections.ADMIN_COLLECTION)
          .insertOne(adminData)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        resolve({ status: false });
      }
    });
  },

  doSignin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let admin = await db
        .get()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ Email: adminData.Email });
      if (admin) {
        bcrypt.compare(adminData.Password, admin.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login Failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("Login Failed");
        resolve({ status: false });
      }
    });
  },


  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const users = await db
          .get()
          .collection(collections.USERS_COLLECTION)
          .find()
          .sort({ createdAt: -1 })  // Sort by createdAt in descending order
          .toArray();

        resolve(users);
      } catch (err) {
        reject(err);  // Handle any error during fetching
      }
    });
  },


  removeUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .removeOne({ _id: objectId(userId) })
        .then(() => {
          resolve();
        });
    });
  },

  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        // Convert the userId to objectId if it's not already
        const objectId = new objectId(userId);

        // Use updateOne to set isDisable to true
        db.get().collection(collections.USERS_COLLECTION).updateOne(
          { _id: objectId }, // Find user by objectId
          { $set: { isDisable: true } }, // Set the isDisable field to true
          (err, result) => {
            if (err) {
              reject(err); // Reject if there's an error
            } else {
              resolve(result); // Resolve if the update is successful
            }
          }
        );
      } catch (err) {
        reject(err); // Catch any error in case of an invalid objectId format
      }
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
