const conn = require('../config/appConn');
const mongoose = require('mongoose');
const moment = require('moment');

const importIncommingDocumentSchema = new mongoose.Schema(
  {
    toBook: { type: String },
    abstractNote: { type: String },
    toBookNumber: { type: Number },
    urgencyLevel: { type: String },
    toBookCode: { type: String },
    senderUnit: { type: String },
    files: [],
    bookDocumentId: { type: mongoose.Schema.Types.ObjectId },
    secondBook: { type: String },
    documentType: { type: String },
    documentField: { type: String },
    receiveMethod: { type: String },
    privateLevel: { type: String },
    currentNote: { type: String },
    nextRole: { type: String },
    letterType: { type: String },
    processAuthorString: { type: String },
    toBookCodeDepartment: { type: String },
    kanbanStatus: { type: String },
    receiverUnit: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: 'OrganizationUnit',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    documentDate: { type: String, set: (date) => moment(date, 'DD/MM/YYYY').format('YYYY/MM/DD') },
    receiveDate: { type: String, set: (date) => moment(date, 'DD/MM/YYYY').format('YYYY/MM/DD') },
    toBookDate: { type: String, set: (date) => moment(date, 'DD/MM/YYYY').format('YYYY/MM/DD') },
    deadLine: { type: String, set: (date) => moment(date, 'DD/MM/YYYY').format('YYYY/MM/DD') },
    stage: String,
    status: {
      type: Number,
      default: 1,
    },
    signer: {},
  },
  {
    timestamps: true,
  },
);

module.exports = conn.model('IncommingDocument', importIncommingDocumentSchema);
