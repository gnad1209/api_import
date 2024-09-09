const conn = require('../config/appConn');
const mongoose = require('mongoose');
const moment = require('moment');

const incommingDocumentSchema = new mongoose.Schema(
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
    documentDate: { type: Date },
    receiveDate: { type: Date },
    toBookDate: { type: Date },
    deadline: { type: Date },
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

module.exports = conn.model('IncommingDocument', incommingDocumentSchema);
