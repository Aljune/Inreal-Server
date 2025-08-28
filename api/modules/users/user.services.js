const User = require("./user.model");

const createUser = async (data) => {
  const user = new User(data);
  return await user.save();
};

const getUsers = async () => {
  return await User.find();
};

const getUserById = async (id) => {
  return await User.findById(id);
};

module.exports = { createUser, getUsers, getUserById };
