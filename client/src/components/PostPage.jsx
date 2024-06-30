import React, { Component } from "react";
import Moment from "react-moment";
import "moment-timezone";
import { PersonCircle, HandThumbsUpFill } from "react-bootstrap-icons";
import { ToastContainer, toast } from "react-toastify";
import http from "../services/httpService";
import { api } from "../config.js";
import PostReply from "./createReply";

class PostPage extends Component {
  state = {
    post: {
      description: "",
      title: "",
      tags: [],
      author: { username: "" },  // Ensure author has a default structure
      upvotes: [],
      views: 0,
    },
    replies: [],
  };

  async componentDidMount() {
    const id = this.props.match.params.id;
    const { data: post } = await http.get(api.postsEndPoint + id);
    const { data: replies } = await http.get(api.repliesEndPoint + id);
    this.setState({ post, replies });
  }

  checkLike() {
    const { user } = this.props;
    const { post } = this.state;
    return user && post.upvotes && post.upvotes.includes(user._id);
  }

  checkReplyLike(id) {
    const { replies } = this.state;
    const { user } = this.props;
    if (user) {
      for (let reply of replies) {
        if (reply._id === id) {
          if (reply.upvotes.includes(user._id)) return true;
        }
      }
    }
    return false;
  }

  handleUpvote = async () => {
    try {
      const { data: post } = await http.put(
        api.postsEndPoint + "like/" + this.props.match.params.id,
        {}
      );
      this.setState({ post: post[0] });
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error("You can't upvote your own post!");
      }
    }
  };

  handleReplyUpvote = async (id) => {
    try {
      const reply_updated = await http.put(api.repliesEndPoint + "like/" + id, {});
      const { data: replies } = await http.get(api.repliesEndPoint + "/" + this.props.match.params.id);
      this.setState({ replies });
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error("You can't upvote your own reply!");
      }
    }
  };

  handleDelete = async () => {
    try {
      await http.delete(api.postsEndPoint + this.props.match.params.id);
      toast.success("Post deleted successfully!");
      this.props.history.push("/");
    } catch (ex) {
      toast.error("Failed to delete the post.");
    }
  };

  handleReplyDelete = async (replyId) => {
    try {
      await http.delete(api.repliesEndPoint + replyId);
      toast.success("Reply deleted successfully.");
      this.setState({ replies: this.state.replies.filter(reply => reply._id !== replyId) });
    } catch (ex) {
      toast.error("Failed to delete the reply.");
    }
  };

  render() {
    const { post, replies } = this.state;
    const { user } = this.props;

    const canDelete = user && (user._id === post.author._id || user.isAdmin);
    const canEdit = user && (user._id === post.author._id);

    return (
      <div>
        <ToastContainer />
        <div className="container col-lg-6 shadow-lg p-3 mt-5 bg-body rounded">
          <h2>{post.title}</h2>
          <p className="mt-4" style={{ color: "#505050" }}>
            {post.description}
          </p>
          <div className="mt-1">
            Related Topics:
            {post.tags &&
              post.tags.map((tag) => (
                <span key={tag._id} className="badge badge-success m-1 p-2">{tag.name}</span>
              ))}
            <div className="d-flex w-100 justify-content-between mt-3 mb-3">
              <button
                disabled={!user}
                className={
                  this.checkLike()
                    ? "btn btn-primary"
                    : "btn btn-outline-primary"
                }
                onClick={this.handleUpvote}
              >
                <HandThumbsUpFill className="mr-2" />
                {(post.upvotes && post.upvotes.length) || 0}
              </button>
              <p>{post.views} Views</p>
            </div>
            <div
              className="d-flex w-100 justify-content-between"
              style={{ color: "#505050" }}
            >
              <div>
                <PersonCircle size={30} className="mr-2" />
                Posted by {post.author.username || "Unknown Author"}
              </div>
              <p className="mb-1">
                <Moment fromNow>{post.time}</Moment>
              </p>
            </div>
            {canDelete && (
              <button
                className="btn btn-danger mt-3"
                onClick={this.handleDelete}
              >
                Delete Post
              </button>
            )}
            {canEdit && (
              <button
                className="btn btn-warning mt-3"
                onClick={null}
                style={{ marginLeft: '15px' }}
              >
                Edit Post
              </button>
            )}
          </div>
        </div>
        {user && <PostReply id={this.props.match.params.id} />}
        <div className="container col-lg-6 shadow-lg p-3 mt-5 bg-body rounded">
          Showing {replies.length} replies
        </div>
        <div>
          {replies &&
            replies.map((reply) => {
              const canDeleteReply = user && (user._id === reply.author._id || user.isAdmin);
              return (
                <div key={reply._id} className="container col-lg-6 shadow-lg p-3 mt-3 bg-body rounded">
                  <div className="ml-4">
                    <PersonCircle size={30} className="mr-3" />
                    Posted by {reply.author ? reply.author.name : "Unknown Author"}
                  </div>
                  <div className="m-4">{reply.comment}</div>
                  <div className="d-flex w-100 justify-content-between mt-3 mb-3">
                    <button
                      className={
                        this.checkReplyLike(reply._id)
                          ? "btn btn-primary"
                          : "btn btn-outline-primary"
                      }
                      disabled={!user}
                      onClick={() => {
                        this.handleReplyUpvote(reply._id);
                      }}
                    >
                      <HandThumbsUpFill className="mr-2" />
                      {reply.upvotes.length}
                    </button>
                    {canDeleteReply && (
                      <button className="btn btn-danger mr-2" onClick={() => this.handleReplyDelete(reply._id)}>
                        Delete Reply
                      </button>
                    )}                
                    <p className="mb-1">
                      <Moment fromNow style={{ color: "#505050" }}>
                        {reply.time}
                      </Moment>
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }
}

export default PostPage;
