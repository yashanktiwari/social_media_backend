const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
    },
    files: {
      type: [],
      default: [],
    },
    comments: [
      {
        data: {
          type: String,
        },
        createdBy: {
          username: {
            type: String
          },
          image: {
            type: String
          },
        },
        date: {
          type: String
        },
        default: []
      },
    ],
    likes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", PostSchema);
module.exports = Post;
