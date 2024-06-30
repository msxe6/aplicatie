const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const { Post } = require('../models/post');
const { Reply } = require('../models/replies');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const posts = await Post.find({ author: userId });

    const replies = await Reply.find({ author: userId });

    const activitySummary = {
      postCount: posts.length,
      postLikesCount: posts.reduce((acc, post) => acc + post.upvotes.length, 0),
      replyCount: replies.length,
      replyLikesCount: replies.reduce((acc, reply) => acc + reply.upvotes.length, 0)
    };

    res.send({ posts, replies, activitySummary });
  } catch (ex) {
    res.status(500).send('Something went wrong');
  }
});

module.exports = router;
