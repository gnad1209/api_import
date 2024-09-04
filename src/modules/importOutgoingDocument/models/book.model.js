const mongoose = require('mongoose');

// Định nghĩa schema cho Books
<<<<<<< HEAD:src/modules/outgoingDocument/models/book.model.js
const documentSchema = new mongoose.Schema(
  {
    toBook: { type: Number, required: true }, // Số, ký hiệu văn bản
    abstractNote: { type: String, required: true }, // Trích yếu
    urgencyLevel: { type: String, default: 'thng' }, // Độ khẩn
    senderUnit: { type: String, required: true }, // Đơn vị soạn thảo
    documentType: { type: String, default: 'Congvan' }, // Loại văn bản
    releaseDate: { type: String }, // Ngày ban hành
    releaseNo: { type: String }, // Số văn bản đi
    documentField: { type: String, default: 'vn-bn-quy-phm-php-lut' }, // Lĩnh vực
    privateLevel: { type: String, default: 'mt' }, // Độ mật
    currentNote: { type: String }, // Nội dung xử lý
    incommingDocument: { type: String }, // Phúc đáp văn bản
    tasks: { type: String }, // Công việc liên quan
    autoReleaseCheck: { type: Boolean, default: false }, // Tự động ban hành
    caSignCheck: { type: Boolean, default: false }, // Ký CA
    currentRole: { type: String }, // Vai trò
    nextRole: { type: String }, // Vai trò tiếp theo
    fileUpload: { type: mongoose.Schema.Types.ObjectId, ref: 'fileManager' }, //VĂN BẢN DỰ THẢO
    fileUpload1: { type: mongoose.Schema.Types.ObjectId, ref: 'fileManager' }, //VĂN BẢN ĐÍNH KÈM
    fileUpload2: { type: mongoose.Schema.Types.ObjectId, ref: 'fileManager' }, //VĂN BẢN BÁO CÁO (NẾU CÓ)

    // toBook: { type: String },
    toBook_en: { type: String },
    // abstractNote: { type: String },
    abstractNote_en: { type: String },
    toBookNumber: { type: Number },
    // urgencyLevel: { type: String },
    urgencyLevel_en: { type: String },
    toBookCode: { type: String },
    toBookCode_en: { type: String },
    senderUnit: { type: String },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'fileManager' }],
    senderUnit_en: { type: String },
    bookDocumentId: { type: String },
    secondBook: { type: String },
    receiverUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'organizationUnit' },
    processorUnits: { type: String },
    // documentType: { type: String },
    documentType_en: { type: String },
    // documentField: { type: String },
    documentField_en: { type: String },
    receiveMethod: { type: String },
    receiveMethod_en: { type: String },
    // privateLevel: { type: String },
    privateLevel_en: { type: String },
    // currentNote: { type: String },
    // currentRole: { type: String },
    // nextRole: { type: String },
    letterType: { type: String },
    processAuthorString: { type: String },
    toBookCodeDepartment: { type: String },
  },
  {
    collection: 'document',
    timestamps: true,
  },
);
=======
const bookSchema = new mongoose.Schema({
  toBook: { type: Number, required: true }, // Số, ký hiệu văn bản
  abstractNote: { type: String, required: true }, // Trích yếu
  urgencyLevel: { type: String, default: 'thng' }, // Độ khẩn
  senderUnit: { type: String, required: true }, // Đơn vị soạn thảo
  documentType: { type: String, default: 'Congvan' }, // Loại văn bản
  releaseDate: { type: String }, // Ngày ban hành
  releaseNo: { type: String }, // Số văn bản đi
  documentField: { type: String, default: 'vn-bn-quy-phm-php-lut' }, // Lĩnh vực
  privateLevel: { type: String, default: 'mt' }, // Độ mật
  currentNote: { type: String }, // Nội dung xử lý
  importIncommingDocument: { type: String }, // Phúc đáp văn bản
  tasks: { type: String }, // Công việc liên quan
  autoReleaseCheck: { type: Boolean, default: false }, // Tự động ban hành
  caSignCheck: { type: Boolean, default: false }, // Ký CA
  currentRole: { type: String }, // Vai trò
  nextRole: { type: String }, // Vai trò tiếp theo
  attachment_file1: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  attachment_file2: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  attachment_file3: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
});
>>>>>>> main:src/modules/importOutgoingDocument/models/book.model.js

// Tạo model từ schema
module.exports = mongoose.model('document', documentSchema);
