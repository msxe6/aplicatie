const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const config = require("config");
const _ = require("lodash");
const Joi = require("joi");
const { User, validates, validateUser } = require("../models/user");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { valid } = require("joi");
const { Post } = require("../models/post");
const {Reply} = require("../models/replies");
const router = express.Router();

router.get('/', [auth, admin], async (req, res) => {
  const users = await User.find().select('name username email isAdmin');
  res.send(users);
});

router.post("/register", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered");
  user = new User({
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    password: await bcrypt.hash(req.body.password, 10),
  });
  try {
    await user.save();
    const token = jwt.sign(
      { _id: user._id, isAdmin: user.isAdmin },
      process.env.jwtPrivateKey
    );
    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send(_.pick(user, ["_id", "name", "email"]));
  } catch (err) {
    console.log("error: ", err);
  }
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.send("this user doesn't exists in the database!");
  res.send(user);
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.send("this user doesn't exist in the database!");
  res.send(user);
});

router.post("/login", async (req, res) => {
  const { error } = validates(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user) return res.send("User already logged in!");
  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email or password");

  const validpassword = await bcrypt.compare(req.body.password, user.password);
  if (!validpassword) return res.status(400).send("invalid email or password");

  const token = jwt.sign(
    { _id: user._id, isAdmin: user.isAdmin },
    process.env.jwtPrivateKey
  );
  res.header("x-auth-token").send(token);
});

router.put('/grant-admin/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found.');

    user.isAdmin = true;
    await user.save();

    res.send(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.put('/revoke-admin/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found.');

    user.isAdmin = false;
    await user.save();

    res.send(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/active-users', [auth, admin], async (req, res) => {
  try {
    const users = await User.find();

    const usersWithScores = await Promise.all(users.map(async (user) => {
      const posts = await Post.find({ author: user._id });
      const replies = await Reply.find({ author: user._id });

      const activitySummary = {
        postCount: posts.length,
        postLikesCount: posts.reduce((acc, post) => acc + post.upvotes.length, 0),
        replyCount: replies.length,
        replyLikesCount: replies.reduce((acc, reply) => acc + reply.upvotes.length, 0)
      };

      const studentScore = activitySummary.postCount * 3 + 
                          activitySummary.postLikesCount + 
                          activitySummary.replyCount * 8 + 
                          activitySummary.replyLikesCount * 2;

      return {
        ...user.toObject(),
        studentScore,
        activitySummary
      };
    }));

    const sortedActiveUsers = usersWithScores.sort((a, b) => b.studentScore - a.studentScore);
    res.send(sortedActiveUsers);
  } catch (err) {
    console.error('Error fetching active users:', err);
    res.status(500).send('Server error');
  }
});


router.post("/logout", async (req, res) => {});

module.exports = router;
