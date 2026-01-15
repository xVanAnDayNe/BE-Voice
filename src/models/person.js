const mongoose = require('mongoose');

const personSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other']
    },

    role: {
      type: String,
      enum: ['User', 'Volunteer'],
      default: 'User'
    }
    ,
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true
    }
    ,
    password: {
      type: String,
      default: null,
      select: false
    }
  },
  {
    collection: 'person',
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: false
    }
  }
);

module.exports = mongoose.model('Person', personSchema);
