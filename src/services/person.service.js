const Person = require("../models/person");
const recording = require("../models/recording");
const sentence = require("../models/sentence");
const { toPublicUser } = require("../utils/person.mapper");
const bcrypt = require("bcrypt");

exports.createGuest = async (data) => {
  const trimmedName = data.name.trim();
  const allUsers = await Person.find({}, "name");
  const existingUser = allUsers.find((user) =>
    user.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (existingUser) {
    const user = await Person.findOne({ _id: existingUser._id });
    return { user, existed: true };
  }

  const created = await Person.create({
    name: trimmedName,
    gender: data.gender,
    role: "User",
  });
  return { user: created, existed: false };
};

// Create or reuse volunteer user
exports.createVolunteer = async (data) => {
  if (!data.email) {
    throw new Error("Email is required for volunteer");
  }
  const email = data.email.trim().toLowerCase();
  let user = await Person.findOne({ email }).select("+password");
  if (user) {
    if (user.role !== "Volunteer") {
      user.role = "Volunteer";
      if (data.password) {
        const hashed = await require("bcrypt").hash(data.password, 10);
        user.password = hashed;
      }
      await user.save();
    }
    return { user, existed: true };
  }
  if (data.name) {
    const trimmedName = data.name.trim();
    const existingByName = await Person.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existingByName) {
      existingByName.email = email;
      existingByName.role = "Volunteer";
      if (data.password) {
        existingByName.password = await require("bcrypt").hash(data.password, 10);
      }
      await existingByName.save();
      return { user: existingByName, existed: true };
    }
  }

  // create new volunteer
  const createdPayload = {
    name: data.name ? data.name.trim() : "Volunteer",
    gender: data.gender || "Other",
    role: "Volunteer",
    email
  };
  if (data.password) {
    createdPayload.password = await require("bcrypt").hash(data.password, 10);
  }
  const created = await Person.create(createdPayload);
  return { user: created, existed: false };
};

exports.getUsers = async () => {
    const rows = await Person.find()
      .select("name gender role createdAt");

    const users = rows.map(toPublicUser);
    const userIds = rows.map(r => r._id);
    if (!userIds.length) return users;
    const uniqueAgg = await recording.aggregate([
      { $match: { personId: { $in: userIds }, isApproved: 1 } },
      { $group: { _id: { personId: "$personId", sentenceId: "$sentenceId" } } },
      { $group: { _id: "$_id.personId", sentences: { $push: "$_id.sentenceId" } } }
    ]);

    const durationAgg = await recording.aggregate([
      { $match: { personId: { $in: userIds }, isApproved: 1 } },
      { $group: { _id: "$personId", totalDuration: { $sum: { $ifNull: ["$duration", 0] } } } }
    ]);

    const sentencesMap = {};
    uniqueAgg.forEach(item => {
      sentencesMap[item._id.toString()] = item.sentences.map(s => s.toString());
    });

    const durationMap = {};
    durationAgg.forEach(item => {
      durationMap[item._id.toString()] = item.totalDuration;
    });
    const contribAgg = await sentence.aggregate([
      { $match: { createdBy: { $ne: null } } },
      { $group: { _id: "$createdBy", count: { $sum: 1 } } }
    ]);
    const contribMap = {};
    contribAgg.forEach(item => { contribMap[item._id] = item.count; });
    const userNames = users.map(u => u.Name).filter(Boolean);
    let createdSentences = [];
    if (userNames.length) {
      createdSentences = await sentence.find({ createdBy: { $in: userNames } })
        .select("content status createdBy createdAt")
        .sort({ createdAt: -1 })
        .lean();
    }
    const createdByMap = {};
    createdSentences.forEach(s => {
      createdByMap[s.createdBy] = createdByMap[s.createdBy] || [];
      createdByMap[s.createdBy].push({
        SentenceID: s._id,
        Content: s.content,
        Status: s.status,
        CreatedAt: s.createdAt
      });
    });
    const allSentenceIds = Object.values(sentencesMap).flat();
    let sentenceDocs = [];
    if (allSentenceIds.length) {
      sentenceDocs = await sentence.find({ _id: { $in: allSentenceIds } })
        .select("content");
    }
    const sentenceById = {};
    sentenceDocs.forEach(s => { sentenceById[s._id.toString()] = s.content; });
    const results = users.map(u => {
      const uid = u.PersonID.toString();
      const sentenceIds = sentencesMap[uid] || [];
      const sentencesDone = sentenceIds.map(id => ({
        SentenceID: id,
        Content: sentenceById[id] || null
      }));
      const totalDuration = durationMap[uid] || 0;
      const totalSentencesDone = (sentenceIds || []).length;
      return {
        ...u,
        SentencesDone: sentencesDone,
        TotalRecordingDuration: totalDuration,
        TotalSentencesDone: totalSentencesDone,
        TotalContributedByUser: contribMap[u.Name] || 0,
        CreatedSentences: createdByMap[u.Name] || []
      };
    });

    return results;
};

// Total number of sentences contributed by users (createdBy not null)
exports.getTotalUserContributions = async (options = {}) => {
  const { includeSentences = true, limit = null } = options;

  const total = await sentence.countDocuments({ createdBy: { $ne: null } });

  if (!includeSentences) {
    return { totalContributed: total };
  }

  let query = sentence.find({ createdBy: { $ne: null } })
    .select("content status createdBy createdAt")
    .sort({ createdAt: -1 });

  if (limit) query = query.limit(Number(limit));

  const sentences = await query.lean();

  return { totalContributed: total, sentences };
};

exports.loginAdmin = async (email, password) => {
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

// Get users sorted by recording count 
exports.getUsersByRecordingCount = async (statusFilter = null, limit = 10) => {
  const matchCondition = {};
  if (statusFilter !== null) {
    matchCondition.isApproved = Number(statusFilter);
  }
  const recordingStats = await recording.aggregate([
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
  const userIds = recordingStats.map(stat => stat._id);
  const users = await Person.find({ _id: { $in: userIds } });
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


// Get users sorted by sentence contributions (only sentences with status 1,2,3)
exports.getUsersBySentenceCount = async (limit = 10) => {
  const stats = await sentence.aggregate([
    { $match: { status: { $in: [1, 2, 3] }, createdBy: { $ne: null } } },
    {
      $group: {
        _id: "$createdBy",
        sentenceCount: { $sum: 1 },
        status1Count: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
        status2Count: { $sum: { $cond: [{ $eq: ["$status", 2] }, 1, 0] } },
        status3Count: { $sum: { $cond: [{ $eq: ["$status", 3] }, 1, 0] } }
      }
    },
    { $sort: { sentenceCount: -1 } },
    { $limit: Number(limit) }
  ]);

  const names = stats.map(s => s._id);
  const users = await Person.find({ name: { $in: names } });

  return stats.map(s => {
    const user = users.find(u => u.name === s._id);
    return {
      userName: s._id,
      userId: user?._id || null,
      totalSentences: s.sentenceCount,
      status1Count: s.status1Count,
      status2Count: s.status2Count,
      status3Count: s.status3Count,
      createdAt: user?.createdAt || null
    };
  });
};

// Get users sorted by number of distinct sentences they recorded
exports.getUsersByUniqueSentenceCount = async (limit = 10, statusFilter = null) => {

  const match = {};
  if (statusFilter !== null) {
    match.isApproved = Number(statusFilter);
  }

  const agg = [
    { $match: match },
    {
      $group: {
        _id: { personId: "$personId", sentenceId: "$sentenceId" }
      }
    },
    {
      $group: {
        _id: "$_id.personId",
        uniqueSentenceCount: { $sum: 1 }
      }
    },
    { $sort: { uniqueSentenceCount: -1 } },
    { $limit: Number(limit) }
  ];

  const stats = await recording.aggregate(agg);
  const userIds = stats.map(s => s._id);
  const users = await Person.find({ _id: { $in: userIds } });

  return stats.map(s => {
    const user = users.find(u => u._id.toString() === s._id.toString());
    return {
      userId: user?._id || s._id,
      name: user?.name || null,
      uniqueSentences: s.uniqueSentenceCount,
      createdAt: user?.createdAt || null
    };
  });
};