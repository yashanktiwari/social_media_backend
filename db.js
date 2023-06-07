const mongoose = require("mongoose");
const DB_URI = process.env.DB_URI;

module.exports.connect_db = () => {
  mongoose
    .connect(DB_URI)
    .then(() => {
      console.log("DB connected");
    })
    .catch((error) => {
      console.log(error);
    });
};
