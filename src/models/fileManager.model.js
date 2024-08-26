const conn = require('../config/appConn');
const mongoose = require('mongoose');

const fileManagerSchema = new mongoose.Schema(
  {
    fullPath: {
      type: String,
      index: true,
    },
    mid: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    name: { type: String },
    parentPath: { type: String },
    username: { type: String },
    isFile: { type: Boolean },
    type: { type: String },
    realName: { type: String },
    clientId: { type: String },
    code: { type: String },
    mimetype: { type: String },
    nameRoot: { type: String },
    createdBy: { type: String },
    smartForm: { type: String },
    isFileSync: { type: Boolean },
    folderChild: { type: Boolean },
    isStarred: { type: Boolean },
    isEncryption: { type: Boolean },
    shares: { type: Array },
    isConvert: { type: Boolean },
    internalTextIds: { type: Array },
    canDelete: { type: Boolean },
    canEdit: { type: Boolean },
    status: { type: Number },
    isApprove: { type: Boolean },
    public: { type: Number },
    permissions: { type: Array },
    users: { type: Array },
    hasChild: { type: Boolean },
  },
  {
    collection: 'fileManager',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('fileManager', fileManagerSchema);
