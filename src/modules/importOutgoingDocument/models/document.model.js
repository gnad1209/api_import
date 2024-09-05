const conn = require('../../config/appConn');
const mongoose = require('mongoose');

// Định nghĩa schema cho Books
const outgoingDocumentSchema = new mongoose.Schema(
  {
    toBook: { type: Number, required: true }, // Số, ký hiệu văn bản
    abstractNote: { type: String, required: true }, // Trích yếu
    urgencyLevel: { type: String }, // Độ khẩn
    senderUnit: { type: String, required: true }, // Đơn vị soạn thảo
    documentType: { type: String }, // Loại văn bản
    releaseDate: { type: String }, // Ngày ban hành
    releaseNo: { type: String }, // Số văn bản đi
    documentField: { type: String }, // Lĩnh vực
    privateLevel: { type: String }, // Độ mật
    currentNote: { type: String }, // Nội dung xử lý
    incommingDocument: { type: String }, // Phúc đáp văn bản
    tasks: { type: String }, // Công việc liên quan
    autoReleaseCheck: { type: Boolean }, // Tự động ban hành
    caSignCheck: { type: Boolean }, // Ký CA
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
    collection: 'outgoingDocument',
    timestamps: true,
  },
);

// Tạo model từ schema
module.exports = conn.model('outgoingDocument', outgoingDocumentSchema);
