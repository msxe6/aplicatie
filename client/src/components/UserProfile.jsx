import React, { useEffect, useState } from 'react';
import { api } from "../config.js";
import http from "../services/httpService";


const UserProfile = () => {
  const [posts, setPosts] = useState([]);
  // eslint-disable-next-line
  const [replies, setReplies] = useState([]);
  const [activitySummary, setActivitySummary] = useState({
    postCount: 0,
    postLikesCount: 0,
    replyCount: 0,
    replyLikesCount: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await http.get(api.meEndPoint);
        setPosts(data.posts);
        setReplies(data.replies);
        setActivitySummary(data.activitySummary);
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="container">
      <h2>Activity Summary</h2>
      <ul>
        <li>Number of Posts: {activitySummary.postCount}</li>
        <li>Number of Post Likes: {activitySummary.postLikesCount}</li>
        <li>Number of Replies: {activitySummary.replyCount}</li>
        <li>Number of Reply Likes: {activitySummary.replyLikesCount}</li>
      </ul>
      <h2>Your Posts</h2>
      {posts.length === 0 ? (
        <p className='text-center'>You have not made any posts yet.</p>
      ) : (
        posts.map(post => (
          <div key={post._id} className="post">
            <h3>{post.title}</h3>
            <p>{post.description}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default UserProfile;
