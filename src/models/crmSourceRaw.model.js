const crmSourceRaw = {
  title: {
    type: String,
    required: true,
  },
  originalName: String,
  canDragDrop: {
    type: Boolean,
    default: true,
  },
  code: {
    type: String,
    default: null,
  },
  extraFields: [],
  type: String,
  data: [
    {
      idOrg: String,
      title: String,
      index: Number,
      value: String,
      x: Number,
      y: Number,
      fontSize: Number,
      extraValue: {},
      moduleCode: {},
      status: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 1,
      },
    },
  ],
  api: 'String',
  originalData: [],
  status: {
    type: Number,
    enum: [0, 1, 2, 3],
    default: 1,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
};
