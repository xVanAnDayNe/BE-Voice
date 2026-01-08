const Person = require("../models/person");


// CREATE guest
exports.createGuest = async (data) => {
  return await Person.create({
    name: data.name,
    gender: data.gender,
    role: "User"
  });
};

// GET ALL users
exports.getAllUsers = async () => {
  return await Person.find()
    .select("name gender role createdAt");
};


