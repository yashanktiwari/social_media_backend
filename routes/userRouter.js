const express = require("express");
const userRouter = express.Router();
const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const cloudinary = require("../utils/cloudinary");
const { createError } = require("../utils/createError");
const _ = require('lodash');

userRouter.route("/updateprofile/:id").patch(updateProfile);

userRouter.route("/addnewpost").post(addNewPost);

userRouter.route('/getmyposts/:id').get(getMyPosts);

userRouter.route('/getallusers').post(getAllUsers);

userRouter.route('/followuser').post(followUser);

userRouter.route('/unfollowuser').post(unfollowUser);

userRouter.route('/getallposts').post(getAllPosts);

userRouter.route('/likepost').post(likePost);

userRouter.route('/unlikepost').post(unlikePost);

userRouter.route('/addcomment').post(addComment);

userRouter.route('/getfollows').post(getFollows);

userRouter.route('/getcomments').post(getComments);

userRouter.route('/getlikes').post(getLikes);

async function updateProfile(req, res, next) {
  const { id } = req.params;
  const {
    username,
    email,
    description,
    mobile,
    gender,
    uploadImage,
    public_id,
  } = req.body;

  if (uploadImage.length !== 0) {
    if (public_id.length !== 0) {
      await cloudinary.uploader.destroy(public_id);
    }

    let result = await cloudinary.uploader.upload(uploadImage, {
      folder: `social_media/Users/${email}`,
    });

    const user = await User.findByIdAndUpdate(id, {
      image: result.url,
      public_id: result.public_id,
      username,
      description,
      mobile,
      gender,
    });
    if (user) {
      const updatedUser = await User.findById(id);
      if (updatedUser) {
        res.send({
          user: updatedUser,
        });
      } else {
        return next(
          createError(
            500,
            "Some error occured, please logout and login again to reflect changes in the data"
          )
        );
      }
    } else {
      return next(createError(500, "Something went wrong"));
    }
  } else {
    const user = await User.findByIdAndUpdate(id, {
      username,
      description,
      mobile,
      gender,
    });
    if (user) {
      const updatedUser = await User.findById(id);
      res.send({
        user: updatedUser,
      });
    } else {
      return next(createError(500, "Something went wrong"));
    }
  }
}

async function addNewPost(req, res, next) {
  const { userid, description, files } = req.body;

  const post = await Post.create({
    createdBy: userid,
    description: description,
    files: files,
  });
  if (post) {
    const user = await User.findById(userid);
    if (user) {
      user.posts.push(post._id);
      await user.save();

      res.send({
        post: post,
        user: user
      });
    }
  } else {
    return next(createError(500, "Some error occurred"));
  }
}

async function getMyPosts(req, res, next) {
  const {id} = req.params;

    const user = await User.findById(id).populate('posts');

    if(user) {
      res.send(user.posts);
    } else {
      next(createError(500, "Some error occurred"));
    }
}

async function getAllUsers(req, res, next) {
  const {username} = req.body;
  // console.log(username);
  const users = await User.find({username: {$regex: `(?i)${username}`}});
  // console.log(users);
  if(users) {
    res.send(users);
  } else {
    return next(createError(500, "Some error occurred"));
  }
}

async function followUser(req, res, next) {
  const {curUserid, followingUserid} = req.body;

  const currentUser = await User.findById(curUserid);
  if(currentUser) {
    currentUser.following.push(followingUserid);
    await currentUser.save();
    const followingUser = await User.findById(followingUserid);
    if(followingUser) {
      followingUser.followers.push(curUserid);
      await followingUser.save();
      res.send({user: currentUser});
    } else {
      return next(createError(500, "Some error occurred"));
    }
  } else {
    return next(createError(500, "Some error occurred"));
  }
}

async function unfollowUser(req, res, next) {
  const {curUserid, unfollowingUserid} = req.body;
  
  const currentUser = await User.findById(curUserid);
  if(currentUser) {
    const idx1 = currentUser.following.indexOf(unfollowingUserid);
    currentUser.following.splice(idx1, 1);
    await currentUser.save();

    const unfollowingUser = await User.findById(unfollowingUserid);
    if(unfollowingUser) {
      const idx2 = unfollowingUser.followers.indexOf(curUserid);
      unfollowingUser.followers.splice(idx2, 1);
      await unfollowingUser.save();

      res.send({
        user: currentUser
      });
    } else {
      return next(createError(500, "Some error occurred"));
    }
  } else {
    return next(createError(500, "Some error occurred"));
  }
}

async function getAllPosts(req, res, next) {
  const {userid} = req.body;

  const user = await User.findById(userid).populate('following');
  if(user) {
    const fUsers = user.following;
    let temp = [];
    const allPosts = [];
    for(const followingUser of fUsers) {
      const data = await User.findById(followingUser._id).populate('posts');
      for(const post of data.posts) {
        temp.push(post);
      }
    }
    for(const post of temp) {
      const p = await Post.findById(post._id).populate('createdBy');
      allPosts.push(p);
    }
    // console.log(allPosts);

    const newArr = _.sortBy(allPosts, "createdAt");

    res.send({
      allPosts: newArr
    });
  } else {
    return next(createError(500, "User not found"));
  }
}

async function likePost(req, res, next) {
  const {postid, userid} = req.body;

  const post = await Post.findById(postid);
  if(post) {
    post.likes.push(userid);
    await post.save();
    const user = await User.findById(userid);
    if(user) {
      user.postsLiked.push(postid);
      await user.save();
      res.send({
        user, post
      });
    } else {
      return next(createError(500, "Error in finding the post"));
    }
  } else {
    return next(createError(500, "Error in finding the post"));
  }
}

async function unlikePost(req, res, next) {
  const {postid, userid} = req.body;

  const post = await Post.findById(postid);
  if(post) {
    const idx1 = post.likes.indexOf(userid);
    post.likes.splice(idx1, 1);
    await post.save();
    const user = await User.findById(userid);
    if(user) {
      const idx2 = user.postsLiked.indexOf(postid);
      user.postsLiked.splice(idx2, 1);
      await user.save();
      res.send({
        user, post
      });
    } else {
      return next(createError(500, "Error in finding the post"));
    }
  } else {
    return next(createError(500, "Error in finding the post"));
  }
}

async function addComment(req, res, next) {
  const {postid, userid, data, date} = req.body;
  
  const post = await Post.findById(postid);
  if(post) {
    const user = await User.findById(userid);
    if(user) {
      const comment = {
        data: data,
        createdBy: {
          username: user.username,
          image: user.image,
        },
        date: date
      };
      post.comments.push(comment);
      await post.save();
      return res.send({
        post: post
      })
    } else {
      return next(createError(500, "Internal Server Error"));
    }
  } else {
    return next(createError(500, "Internal Server Error"));
  }
}

async function getFollows(req, res, next) {
  const {userid} = req.body;
  const user = await User.findById(userid).populate('followers').populate('following');
  if(user) {

    res.send({
      followers: user.followers,
      following: user.following
    });
  } else {
    return next(createError(404, "User not found"));
  }
}

async function getComments(req, res, next) {
  const {postid} = req.body;

  const post = await Post.findById(postid);
  if(post) {
    return res.send({
      comments: post.comments
    });
  } else {
    return next(createError(500, "Some error occurred"));
  }
}

async function getLikes(req, res, next) {
  const {postid} = req.body;
  
  const post = await Post.findById(postid).populate('likes');
  if(post) {
    return res.send({
      likes: post.likes
    });
  } else {
    return next(createError(500, "Some error occurred"));
  }
}

module.exports = userRouter;