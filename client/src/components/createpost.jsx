import React from "react";
import Joi from "joi-browser";
import { ToastContainer, toast } from "react-toastify";
import Input from "./common/input";
import Form from "./common/form";
import http from "../services/httpService";
import { api } from "../config.js";
import { createpost } from "../services/postCreateService";

class NewPost extends Form {
  state = {
    data: { title: "", description: "", tags: [] },
    errors: { title: "", description: "", tags: [] },
    tags: [],
  };

  schema = {
    title: Joi.string().required().min(10).label("Title"),
    description: Joi.string().required().min(5).label("Description"),
    tags: Joi.array().label("Tags"),
  };

  handleTagChange = (tagID) => {
    const data = { ...this.state.data };
    const newtags = [...data.tags];
    const index = newtags.indexOf(tagID);
    console.log(index);
    if (index === -1) newtags.push(tagID);
    else newtags.splice(index, 1);
    data.tags = newtags;
    console.log(data.tags)
    this.setState({ data });
  };

  async componentDidMount() {
    try {
      const { data: tags } = await http.get(api.tagsEndPoint);
      this.setState({ tags });
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error("Failed to load tags!");
      }
    }
  }

  doSubmit = async () => {
    try {
      const { data } = this.state;
      await createpost(data);
      console.log(data.tags)
      window.location = "/dashboard";
    } catch (ex) {
      toast.error("Failed to create post!");
    }
  };

  render() {
    const { data, errors, tags } = this.state;
    return (
      <React.Fragment>
        <ToastContainer />
        <div className="container-lg">
          <h1 className="text-center m-2">Create a New Discussion</h1>
          <div
            className="container m-4 p-4 rounded"
            style={{ backgroundColor: "#F1F1F1" }}
          >
            <form onSubmit={this.handleSubmit}>
              <Input
                value={data.title}
                onChange={this.handleChange}
                label="Title"
                name="title"
                type="text"
                error={errors.title}
              />
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  value={data.description}
                  onChange={this.handleChange}
                  name="description"
                  type="description"
                  id="description"
                  className="form-control"
                />
                {errors.description && (
                  <div className="alert-info">{errors.description}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="tags">Related Tags</label>
                <br />
                {tags.map((tag) => (
                  <label className="mr-3 ml-3" key={tag._id}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onChange={() => this.handleTagChange(tag._id)}
                    />
                    {tag.name}
                  </label>
                ))}
                {errors.tags && <div className="alert-info">{errors.tags}</div>}
              </div>
              <div className="text-center">
                <button
                  className="btn btn-primary mt-4"
                  disabled={this.validate()}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default NewPost;
