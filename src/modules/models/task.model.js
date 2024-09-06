const conn = require('../config/appConn');
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
{
      name: {
        type: String,
        required: [true, 'Tên không được để trống'],
      },
      kanbanStatus: String,
      kanban: [{ name: String, code: String }],
      kanbanCode: String,
      code: {
        type: String,
      },
      parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
      ratio: Number,
      costEstimate: {
        type: Number,
        default: 0,
      },
      description: {
        type: String,
        default: '',
      },
      finishDate: Date,
      template: { type: mongoose.Schema.Types.ObjectId, ref: 'TemplateTask' },
      disable: {
        type: Boolean,
        default: false,
      },
      source: String,
      startDate: {
        type: Date,
        required: true,
      },
      isProject: { type: Boolean, default: true },
      progress: {
        type: Number,
        default: 0,
        min: [0, 'Tiến độ giá trị nhỏ nhất là 0'],
        max: [100, 'Tiến độ giá trị lớn nhất là 100'],
      },
      endDate: {
        type: Date,
        required: true,
      },
      workDate: Number,
      level: { type: Number },
      duration: { type: Number, required: true, default: 0 },
      // Trạng thái 1: Chưa thực hiện, 2:Đang thực hiện, 3:Hoàn thành, 4:Đóng, 5 Tạm dừng, 6:Không thực hiện

      // 1: Bán hàng, 2: Hành chính, 3: Thi công, 4: Bảo hành
      // category: { type: Number, enum: [1, 2, 3, 4] },
      category: { type: Number, enum: { values: [1, 2, 3, 4], message: 'Độ ưu tiên: 1, 2, 3 hoặc 4' } },

      // 1 Cv thương, 2 Công việc không tạo doanh thu, 3 Cá nhân,
      taskType: { type: Number, enum: [1, 2, 3] },
      typeTask: { type: Number, enum: [1, 2, 3, 4] }, // loai cong viec
      taskMaster: {
        // người giao việc
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
      planerStatus: { type: String, default: '1' },

      // eslint-disable-next-line no-tabs
      // 1:Rất Cao, 2: Cao, 3 Trung bình, 4 Thấp, 5:Rất thấp
      // priority: { type: Number, enum: [1, 2, 3, 4, 5], default: 3 },
      priority: { type: Number, enum: { values: [1, 2, 3, 4, 5], message: 'Độ ưu tiên: 1, 2 hoặc 3' }, default: 3 },
      inCharge: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
      processors: [
        {
          // createdBy: {
          //   type: mongoose.Schema.Types.ObjectId,
          //   ref: 'Employee',
          // },
          // receiver: {
          //   type: mongoose.Schema.Types.ObjectId,
          //   ref: 'Employee',
          // },
          // action: String,
          // // deadline: String,
          // // stageStatus: String,
          // // progress: String,
          // taskLevel: String,
          // statusAccept: String,
          // position: String,
          // role: String,
          // note: String,
        },
      ],

      organizationUnit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit',
      },
      // Link đến module, đúng trạng thái sẽ thông báo :((
      link: String,
      moduleStatus: String,
      contractCode: String,
      totalContractValue: { type: Number, default: 0 },
      viewable: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
      // 1 Giai đoạn thông tin thị trường, chốt chủ trương, 2 Giai đoạn tiền dự án, 3 Dự Án GĐ Đang Thi Công,
      //  4 Dự Án GĐ Chuẩn Bị Thi Công, 5 Dự Án Giai Đoạn Nghiệm Thu, 6 Dự Án Giai Đoạn Thu Hồi Công Nợ
      taskStage: Number,
      // Người hỗ trợ
      support: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
      taskManager: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
      processMain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },

      combination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },

      taskRelate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },

      document: {
        type: mongoose.Schema.Types.ObjectId,
      },

      // Người phê duyệt
      approved: [
        {
          name: String,
          id: mongoose.Schema.Types.ObjectId,
        },
      ],
      isApproved: Boolean,
      // Người tham gia
      join: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
      supportAccept: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
      inChargeAccept: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
      supportRefuse: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      ],
      inChargeRefuse: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
      returnEmp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
      isAccept: { type: Boolean },
      joinPlan: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
      inChargePlan: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
      supportPlan: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
      // Người phê duyệt tiến độ
      approvedProgress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
      // 1 bảo mật, 2 Ẩn 3 Mở rộng 4 Công khai
      type: {
        type: Number,
        enum: [1, 2, 3, 4],
        default: 4,
      },
      planApproval: {
        type: Number,
        default: 0,
      },
      geography: {},
      avatar: String,
      taskLevel: String, // mức độ hoàn thành
      statusAccept: { type: String, default: 'okay' }, // trạng thái hỗ trợ, xử lý chính
      order: Number,
      remember: Boolean,
      dateRemember: String,
      rememberTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      isSmallest: Boolean,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      mettingSchedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar', default: null },
      documentary: {
        // cong van
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Documentary',
      },
      startDatePlan: Date,
      endDatePlan: Date,
      note: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      planApprovalUsers: [],
     
      name_en: String,
      code_en: String,
      source_en: String,
      description_en: String,
      taskManagerStr: String,
      taskManagerStr_en: String,
      joinStr: String,
      joinStr_en: String,
      inChargeStr: String,
      inChargeStr_en: String,
      supportStr: String,
      supportStr_en: String,
      approvedStr: String,
      approvedStr_en: String,
      desHtml: String,
      debt: { type: Number, default: 0 },
      sourceLogId: String,
      leafIndex: { type: Number }, // công việc lá
      kanbanStatusNow: { type: Number, default: 0, enum: [0, 1] }, // đánh dấu công việc hiện tại
      acceptApproval: {
        type: Number,
        default: 0,
      },
      taskCostEstimateFormula: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskCostEstimateFormula',
      },
      costRealityValue: { type: Number, default: 0 },
      relatedTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
      relatedDoc: {
        id: String,
        modelRef: String,
        label: String,
      },
      taskPlan: { type: String, enum: ['TASK', 'TASKPLAN'], default: 'TASK' },
      accuseds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'People',
        },
      ],
      letterId: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Letter',
        },
      ],
      incommingDocuments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'IncommingDocument',
        },
      ],
      outGoingDocuments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'OutGoingDocument',
        },
      ],
      processed: [
        {
          employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
          },
          note: String,
          acction: String,
          miss: String,
        },
      ],
      // @note công việc liên quan
      taskAttached: [],
      // @note hscv gốc
      relateTo: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Task',
        },
      ],
      templateName: String,
      // ý kiến của người đứng đầu phòng
      comment: String,
      fileAttachCreatedBy: [],
    }
);

module.exports = conn.model('task', taskSchema);
