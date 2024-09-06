const conn = require('../config/appConn');
const mongoose = require('mongoose');

const senderUnitSchema = new mongoose.Schema(
  {
    status: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      require: true,
    },
    title_en: String,
    value: {
      type: String,
      require: true,
    },
    index: Number,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = conn.model('senderUnit', senderUnitSchema);
