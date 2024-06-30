import React, { useState, useEffect } from 'react';
import http from "../services/httpService";
import { api } from "../config.js";
import { ToastContainer, toast } from 'react-toastify';

const UsersPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await http.get(`${api.usersEndPoint}`);
        console.log("Fetched users:", data);
        setUsers(data);
        setFilteredUsers(data);
      } catch (ex) {
        toast.error('Failed to fetch users.');
        console.error("Error fetching users:", ex);
      }
    };

    fetchUsers();
  }, []);

  const handleAdminToggle = async (userId, isAdmin) => {
    try {
      const endpoint = `${api.usersEndPoint}/${isAdmin ? 'revoke-admin' : 'grant-admin'}/${userId}`;
      await http.put(endpoint);
      toast.success(`User ${isAdmin ? 'revoked as admin' : 'granted admin'} successfully.`);
      const updatedUsers = users.map(u => u._id === userId ? { ...u, isAdmin: !isAdmin } : u);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
    } catch (ex) {
      toast.error('Failed to update admin status.');
      console.error("Error updating admin status:", ex);
    }
  };

  const handleFilterActiveUsers = async () => {
    try {
      const { data } = await http.get(`${api.usersEndPoint}/active-users`);
      console.log("Filtered active users:", data);
      setFilteredUsers(data);
      setIsFiltered(true);
    } catch (ex) {
      toast.error('Failed to fetch active users.');
      console.error("Error fetching active users:", ex);
    }
  };

  const handleClearFilter = () => {
    console.log("Clearing filter");
    setFilteredUsers(users);
    setIsFiltered(false);
  };

  const handleSearch = (e) => {
    const searchQuery = e.currentTarget.value.toLowerCase();
    const filtered = users.filter(u => 
      u.name.toLowerCase().includes(searchQuery) ||
      u.username.toLowerCase().includes(searchQuery) ||
      u.email.toLowerCase().includes(searchQuery)
    );
    console.log("Filtered users by search:", filtered);
    setFilteredUsers(filtered);
  };

  if (!user || !user.isAdmin) {
    return <div>You do not have permission to view this page.</div>;
  }

  return (
    <div>
      <ToastContainer />
      <h1 className="text-center">All Users</h1>
      <input
        type="text"
        name="search"
        className="form-control my-3"
        placeholder="Search users..."
        onChange={handleSearch}
      />
      <div className="mb-4">
        <button className="btn btn-primary mr-2" onClick={handleFilterActiveUsers}>
          Show Active Users
        </button>
        {isFiltered && (
          <button className="btn btn-secondary" onClick={handleClearFilter}>
            Clear Filter
          </button>
        )}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
            filteredUsers.map(u => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.isAdmin ? "Yes" : "No"}</td>
                <td>
                  {u._id !== user._id && (
                    <button
                      className={`btn ${u.isAdmin ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => handleAdminToggle(u._id, u.isAdmin)}
                    >
                      {u.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
