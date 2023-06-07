const mongoose = require('mongoose');
const otpGenerator = require('otp-generator');

const UserSchema = new mongoose.Schema({
  image: {
    type: String,
    default: "https://media.istockphoto.com/id/1337144146/vector/default-avatar-profile-icon-vector.jpg?s=612x612&w=0&k=20&c=BIbFwuv7FxTWvh5S3vB6bkT0Qv8Vn8N5Ffseq84ClGI="
  },
  public_id: {
    type: String,
    default: ""
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  confirmPassword: {
    type: String,
  },
  gender: {
    type: String,
    default: ""
  },
  mobile: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  followers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    default: []
  },
  following: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    default: []
  },
  posts: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
      }
    ],
    default: []
  },
  postsLiked: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
      }
    ],
    default: []
  },
  joiningDate: {
    type: String
  },
  otp: {
    type: String
  }
}, { timestamps: true });

UserSchema.methods.generateOTP = () => {
  let gotp = otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false
  });
  return gotp;
}

const User = mongoose.model('User', UserSchema);
module.exports = User;