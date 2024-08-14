const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  status: { type: Number, default: 1 },
  kanbanStatus: { type: Number, default: 1 },
  profileTitle: String,
  title: String,
  profileYear: Number,
  binderCode: String,
  organizationUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationUnit' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  sortIndex: String,
  code: String,
  codeOrg: String,
  historyOrg: String,
  room: String,
  pageQuantity: { type: Number, default: 0 },
  sheetQuantity: { type: Number, default: 0 },
  documentQuantity: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Profile', ProfileSchema);