const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  status: { type: Number, default: 1 },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  profileIndex: String,
  organizationUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationUnit' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  abstract: String,
  page_count: Number,
  code: String,
  codeOrg: String,
  historyOrg: String,
  room: String,
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileManager' },
  originalFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileManager' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', DocumentSchema);