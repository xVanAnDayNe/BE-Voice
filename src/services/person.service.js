const Person = require("../models/person");
const { toPublicUser } = require("../utils/person.mapper");
const bcrypt = require("bcrypt");

exports.createGuest = async (data) => {
  const trimmedName = data.name.trim();

  // Kiểm tra tên đã tồn tại chưa (case insensitive)
  const allUsers = await Person.find({}, 'name');
  const existingUser = allUsers.find(user =>
    user.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (existingUser) {
    throw new Error("Tên người dùng đã tồn tại");
  }

  return await Person.create({
    name: trimmedName,
    gender: data.gender,
    role: "User"
  });
};

exports.getUsers = async () => {
    const rows = await Person.find()
      .select("name gender role createdAt");
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

exports.updateUserName = async (id, newName) => {
  if (!newName || newName.trim() === "") {
    throw new Error("Tên không được rỗng");
  }

  const trimmedName = newName.trim();

  // Kiểm tra tên đã tồn tại với user khác chưa (case insensitive)
  const allUsers = await Person.find({ _id: { $ne: id } }, 'name');
  const existingUser = allUsers.find(user =>
    user.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (existingUser) {
    throw new Error("Tên người dùng đã tồn tại");
  }

  const updatedUser = await Person.findByIdAndUpdate(
    id,
    { name: trimmedName },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error("User không tồn tại");
  }

  return updatedUser;
};

exports.deleteUser = async (id) => {
  const deletedUser = await Person.findByIdAndDelete(id);

  if (!deletedUser) {
    throw new Error("User không tồn tại");
  }

  return deletedUser;
};

// Get users sorted by recording count (most recordings first)
exports.getUsersByRecordingCount = async (statusFilter = null, limit = 10) => {
  const matchCondition = {};
  if (statusFilter !== null) {
    matchCondition.isApproved = Number(statusFilter);
  }

  // Aggregate recordings by personId
  const recordingStats = await require("../models/recording").aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$personId",
        recordingCount: { $sum: 1 },
        approvedCount: {
          $sum: { $cond: [{ $eq: ["$isApproved", 1] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$isApproved", 0] }, 1, 0] }
        },
        rejectedCount: {
          $sum: { $cond: [{ $eq: ["$isApproved", 2] }, 1, 0] }
        }
      }
    },
    { $sort: { recordingCount: -1 } },
    { $limit: Number(limit) }
  ]);

  // Get user details for each personId
  const userIds = recordingStats.map(stat => stat._id);
  const users = await Person.find({ _id: { $in: userIds } });

  // Combine recording stats with user info
  const result = recordingStats.map(stat => {
    const user = users.find(u => u._id.toString() === stat._id.toString());
    return {
      userId: user?._id,
      name: user?.name,
      gender: user?.gender,
      totalRecordings: stat.recordingCount,
      approvedRecordings: stat.approvedCount,
      pendingRecordings: stat.pendingCount,
      rejectedRecordings: stat.rejectedCount,
      createdAt: user?.createdAt
    };
  });

  return result;
};


