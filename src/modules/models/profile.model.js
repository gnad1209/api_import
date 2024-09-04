const { type } = require('os');
const conn = require('../config/appConn');
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    status: { type: Number },
    kanbanStatus: { type: Number },
    profileTitle: { type: String },
    title: { type: String },
    profileYear: { type: Date },
    binderCode: { type: String },
    organizationUnitId: { type: String },
    createdBy: { type: String, index: true },
    planId: { type: String },
    sortIndex: { type: String },
  },
  {
    collection: 'profile',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('profile', profileSchema);
