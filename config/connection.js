const mongoClient = require("mongodb").MongoClient;

const state = {
  db: null,
};

module.exports.connect = function (done) {
  const url = 'mongodb+srv://cmpportal:cmp123@cmp.ymkim.mongodb.net/?retryWrites=true&w=majority&appName=complaint-portal'
  const dbname = 'complaint-portal';

  mongoClient.connect(url, { useUnifiedTopology: true }, (err, data) => {
    if (err) {
      return done(err);
    }
    state.db = data.db(dbname);

    done();
  });
};

module.exports.get = function () {
  return state.db;
};
