const { type } = require('os');
const conn = require('../../config/appConn');
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    fullPath: {
      type: String,
      required: true,
      index: true,
    },
    mid: { type: String },
    name: { type: String }, // tên file đặt tên theo ý muốn (từ dữ liệu excel)
    parentPath: { type: String }, // pwd thư mục lưu file
    username: { type: String }, // fix cứng id của user thực hiện upload
    isFile: { type: Boolean }, // fix cứng giá trị true
    type: { type: String }, // gần như là pdf
    realName: { type: String }, // tên file thực tế lưu trên 03, là tên được gen với chuỗi random
    clientId: { type: String }, // fix cứng, k quan tâm
    code: { type: String }, //
    mimetype: { type: String }, //
    nameRoot: { type: String }, // như trên
    createdBy: { type: String }, // fix cứng
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
    collection: 'File',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('File', fileSchema);
