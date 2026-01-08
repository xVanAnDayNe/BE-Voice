const User = require("../models/person");

exports.toPublicUser = (row) => ({
  PersonID: row._id,
  Name: row.name,
  Gender: row.gender,
  Role: row.role,
  CreatedAt: row.createdAt
});

exports.toAdminUser = (row) => {
    return {
        id: row._id,
        name: row.name,
        email: row.email,
        password: row.password,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    };
};


exports.toGuestUser = (row) => {
    return {
        name: row.name,
        gender: row.gender,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    };
};
