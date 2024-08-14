const mongoose = require('mongoose');

const FileManagerSchema = new mongoose.Schema({
  fullPath: String,
  mid: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  name: String,
  parentPath: String,
  username: String,
  isFile: { type: Boolean, default: true },
  type: String,
  realName: String,
  clientId: String,
  code: String,
  mimetype: String,
  nameRoot: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  smartForm: String,
  isFileSync: { type: Boolean, default: false },
  folderChild: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  isEncryption: { type: Boolean, default: false },
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isConvert: { type: Boolean, default: false },
  internalTextIds: [String],
  canDelete: { type: Boolean, default: true },
  canEdit: { type: Boolean, default: true },
  status: { type: Number, default: 1 },
  isApprove: { type: Boolean, default: false },
  public: { type: Number, default: 0 },
  permissions: [String],
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hasChild: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FileManager', FileManagerSchema);