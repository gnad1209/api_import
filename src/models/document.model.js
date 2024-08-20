const { type } = require('os');
const conn = require('../config/appConn');
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    toBook: { type: String },
    toBook_en: { type: String },
    abstractNote: { type: String },
    abstractNote_en: { type: String },
    bookDocumentIdName: { type: String },
    urgencyLevel: { type: String },
    urgencyLevel_en: { type: String },
    toBookCode: { type: String },
    toBookCode_en: { type: String },
    senderUnit: { type: String },
    files: { type: String },
    senderUnit_en: { type: String },
    bookDocumentId: { type: String },
    secondBook: { type: String },
    receiverUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'Receiver' },
    processorUnits: { type: String },
    documentType: { type: String },
    documentType_en: { type: String },
    documentField: { type: String },
    documentField_en: { type: String },
    receiveMethod: { type: String },
    receiveMethod_en: { type: String },
    privateLevel: { type: String },
    privateLevel_en: { type: String },
    currentNote: { type: String },
    currentRole: { type: String },
    nextRole: { type: String },
    letterType: { type: String },
    processAuthorString: { type: String },
    toBookCodeDepartment: { type: String },
  },
  {
    collection: 'Document',
    timestamps: true,
  }, // Lưu trữ trong collection 'results' và thêm timestamp tự động.
);

module.exports = conn.model('Document', documentSchema);
