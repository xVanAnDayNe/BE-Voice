const userRepo = require("../repositories/person.repository");
const { toPublicUser } = require("../utils/person.mapper");
const bcrypt = require("bcrypt");

exports.createGuest = async (data) => {
  return await userRepo.createGuest(data);
};

exports.getUsers = async () => {
    const rows = await userRepo.getAllUsers();
    return rows.map(toPublicUser);
};

exports.loginAdmin = async (username, password) => {
  if (username !== process.env.ADMIN_USERNAME) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(
    password,
    process.env.ADMIN_PASSWORD_HASH
  );

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return {
    role: "Admin"
  };
};


