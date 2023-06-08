const express = require("express");
const authRouter = express.Router();
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { createError } = require('../utils/createError');
const nodemailer = require('nodemailer');

authRouter.route("/signup").post(signupUser);

authRouter.route('/login').post(loginUser);

authRouter.route('/logout').get(logoutUser);

authRouter.route('/checkauthuser').get(checkAuthorizedUser)

authRouter.route('/checkunauthuser').get(checkUnauthorizedUser)

authRouter.route('/forgotpassword').post(forgotPassword);

authRouter.route('/verifyotp').post(verifyOtp);

authRouter.route('/changepassword').post(changePassword);

async function signupUser(req, res, next) {
  const { username, email, password, confirmPassword, joiningDate } = req.body;

  if (password !== confirmPassword) {
    return next(createError(406, "Password and confirm password did not match"));
    // return res.status(406).send({
    //   error: "Password and confirm password did not match"
    // })
  }

  try {
    const user = await User.findOne({ email: email });
    if (user) {
      return next(createError(403, "User already exists"));
      // res.status(200).send("User already found");
    } else {
      const hashedPassword = await bcrypt.hash(password, 5);

      const newUser = await User.create({
        username: username,
        email: email,
        password: hashedPassword,
        joiningDate
      });

      if (newUser) {
        res.status(201).send(newUser);
      } else {
        return next(createError(500));
        // res.status(500).send({
        //   error: "Internal Server Error"
        // });
      }
    }
  } catch (error) {
    next(createError(500, "Some error occurred"));
    // console.log(error);
    // res.status(500).send({
    //   error: "Some error occurred"
    // });
  }
}

async function loginUser(req, res, next) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email });
  if (user) {
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      const token = jwt.sign({ payload: user._id }, process.env.PRIVATE_KEY);

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });

      const { password, ...info } = user._doc;

      res.status(200).send({
        username: user.username,
        user: info
      });
    } else {
      // console.log(err.status);
      // console.log(err.message);

      return next(createError(404, "Invalid Credentials"));
      // res.status(404).send({
      //   error: "Invalid Credentials"
      // });  
    }
  } else {
    return next(createError(404, "User not found"));
    // res.status(404).send({
    //   error: "Invalid Credentials"
    // });
  }
}

function logoutUser(req, res) {
  res.clearCookie('token', {
    sameSite: "none",
    secure: true,
  }).status(200).send("User has been logged out");
}

async function checkAuthorizedUser(req, res, next) {
  if (req.cookies['token']) {
    const token = req.cookies['token'];
    const userid = await jwt.verify(token, process.env.PRIVATE_KEY);
    const user = await User.findById(userid.payload);
    res.send({ user: user });
  } else {
    return next(createError(401, "Please login first"));
  }
}

function checkUnauthorizedUser(req, res, next) {
  if (!req.cookies['token']) {
    res.send("Login");
  } else {
    return next(createError(500, "Already logged in"));
  }
}

function forgotPassword(req, res) {
  const {email} = req.body;

  User.findOne({email: email})
      .then((userObj) => {
          if(userObj == null) {
              res.send({
                  error: "User not found"
              })
          } else {
              let otp = userObj.generateOTP();
              User.updateOne({email: email}, {$set: {otp: otp}})
                  .then(() => {
                      sendmail(email, otp);
                      res.send(userObj);
                  })
                  .catch((err) => {
                    console.log(err);
                      res.send({
                          error: "Some error occurred"
                      })
                  });
          }
      })
      .catch((error) => {
          res.send({
              error: error.message
          })
      });
}


function sendmail(email, otp) {
  let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // port for smtp
      secure: false,
      auth: {
          user: 'assist.estately@gmail.com',
          pass: 'jajypjwmtotuyfjq'
      }
  });

  transporter.sendMail({
      from: `assist.estately@gmail.com`,
      to: `${email}`,
      subject: `Reset your password`,
      html: `
<!DOCTYPE html>
<h1>Hii, Recently there was a request made to change your password.</h1>
<h3>The OTP for changing the password is ${otp}</h3>
`
  })
      .then((info) => {
          return info;
      })
      .catch((error) => {
          console.log(error);
          return error;
      });
}

function verifyOtp(req, res) {
  const {email, otp} = req.body;

  User.findOne({email: email})
      .then((user) => {
          if(user.otp === otp) {
              User.updateOne({email: email}, {$unset: {otp: 1}})
                  .then(() => {
                      res.send({
                          success: "OTP verified"
                      });
                  })
                  .catch((error) => {
                      res.send({
                          error: "Some error occurred"
                      });
                  });
          } else {
              res.send({
                  error: "Incorrect OTP"
              })
          }
      })
      .catch((error) => {
          res.send({
              error: error
          })
      });
}

function changePassword(req, res) {
  const {email, newpassword} = req.body;

  User.findOne({email: email})
      .then(async (userObj) => {
          if (userObj == null) {
              res.send({
                  error: "User not found"
              });
          } else {
              const salt = await bcrypt.genSalt(10);
              const hashedPassword = await bcrypt.hash(newpassword, salt);

              User.updateOne({email: email}, {$set: {password: hashedPassword}})
                  .then(() => {
                      res.send({
                          success: "Updated Password Successfully"
                      });
                  })
                  .catch((error) => {
                      res.send({
                          error: "Some error occurred"
                      });
                  });
          }
      })
}

module.exports = authRouter;