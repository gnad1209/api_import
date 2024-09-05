const conn = require('../config/appConn');
const mongoose = require('mongoose');
const moment = require('moment');

const importIncommingDocumentSchema = new mongoose.Schema(
  {
    toBook: { type: String },
    toBook_en: { type: String },
    abstractNote: { type: String },
    abstractNote_en: { type: String },
    toBookNumber: { type: Number },
    urgencyLevel: { type: String },
    urgencyLevel_en: { type: String },
    toBookCode: { type: String },
    toBookCode_en: { type: String },
    senderUnit: { type: String },
    files: [],
    senderUnit_en: { type: String },
    bookDocumentId: { type: String },
    secondBook: { type: String },
    // receiverUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'organizationUnit' },
    receiverUnit: { type: String },
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
    kanbanStatus: { type: String },
    receiverUnit: { type: String },
    createdBy: { type: String },
    documentDate: { type: String, set: (date) => moment(date, 'DD/MM/YYYY').format('YYYY/MM/DD') },
    receiveDate: { type: String, set: (date) => moment(date, 'DD/MM/YYYY').format('YYYY/MM/DD') },
    toBookDate: { type: String, set: (date) => moment(date, 'DD/MM/YYYY').format('YYYY/MM/DD') },
    deadLine: { type: String, set: (date) => moment(date, 'DD/MM/YYYY').format('YYYY/MM/DD') },
    signer: {},
  },
  {
    collection: 'importIncommingDocument',
    timestamps: true,
  },
);

module.exports = conn.model('importIncommingDocument', importIncommingDocumentSchema);
