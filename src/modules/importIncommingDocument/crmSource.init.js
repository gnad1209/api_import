const crmSource = [
  // {
  //   title: 'Nguồn',
  //   canDragDrop: true,
  //   type: 'DocumentConfig',
  //   code: 'S06',
  // },
  // {
  //   title: 'Ngành nghề',
  //   canDragDrop: true,
  //   type: 'DocumentConfig',
  //   code: 'S12',
  // },
  // {
  //   title: 'Khu vực địa lý',
  //   canDragDrop: true,
  //   type: 'DocumentConfig',
  //   code: 'S10',
  // },
  // {
  //   title: 'Loại sự kiện',
  //   canDragDrop: true,
  //   type: 'DocumentConfig',
  //   code: 'S16',
  // },
  // {
  //   title: 'Loại đơn vị',
  //   canDragDrop: false,
  //   type: 'DocumentConfig',
  //   code: 'S01',
  // },
  // {
  //   title: 'Ngân hàng',
  //   canDragDrop: false,
  //   type: 'DocumentConfig',
  //   code: 'S04',
  // },
  // {
  //   title: 'Công đoạn',
  //   canDragDrop: false,
  //   type: 'DocumentConfig',
  //   code: 'S05',
  // },
  {
    title: 'Loại văn bản',
    canDragDrop: false,
    type: 'DocumentConfig',
    code: 'S19',
    data: [
      {
        _id: '61e920c6d1e1e81e51719ea4',
        title: 'Công văn',
        value: 'Congvan',
      },
      {
        _id: '61e920c6d1e1e81e51719ea3',
        title: 'Đơn thư',
        value: 'Donthu',
      },
      {
        _id: '61e920c6d1e1e81e51719ea2',
        title: 'Tường trình',
        value: 'Tuongtrinh',
      },
      {
        _id: '61e920c6d1e1e81e51719ea1',
        title: 'Baocao',
        value: 'Baocao',
      },
    ],
  },
  {
    title: 'Độ khẩn',
    canDragDrop: false,
    code: 'S20',
    type: 'DocumentConfig',
    data: [
      {
        _id: '617a12543710ef23fa2c286a',
        title: 'Thường',
        value: 'Dthng',
        index: 4,
      },
      {
        _id: '6170e8c992733754a18dce2a',
        title: 'Khẩn',
        value: 'Ckhn',
        index: 3,
      },
      {
        _id: '6170e8c992733754a18dce2b',
        title: 'Thượng khẩn',
        value: 'Bthng-khn',
        index: 2,
      },
      {
        _id: '6170e8c992733754a18dce2c',
        title: 'Hỏa tốc',
        value: 'Aha-tc',
        index: 1,
      },
    ],
  },
  {
    title: 'Độ mật',
    canDragDrop: false,
    code: 'S21',
    type: 'DocumentConfig',
    data: [
      {
        _id: '6170eaceff4a36548ff2bb32',
        title: 'Mật',
        value: 'mt',
      },
      {
        _id: '617a1244ccd4ad24164bdcc4',
        title: 'Thường',
        value: 'thng',
      },
      {
        _id: '6170eaceff4a36548ff2bb34',
        title: 'Tuyệt mật',
        value: 'tuyt-mt',
      },
      {
        _id: '6170eaceff4a36548ff2bb33',
        title: 'Tối mật',
        value: 'ti-mt',
      },
    ],
  },
  // {
  //   title: 'Nơi lưu trữ công văn',
  //   canDragDrop: false,
  //   code: 'S22',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Nơi phát hành công văn',
  //   canDragDrop: false,
  //   code: 'S23',
  //   type: 'DocumentConfig',
  // },
  {
    title: 'Lĩnh vực',
    canDragDrop: false,
    code: 'S26',
    type: 'DocumentConfig',
    data: [
      {
        _id: '6170e7f1ff4a36548ff2bac8',
        title: 'Văn bản quy phạm pháp luật',
        value: 'vn-bn-quy-phm-php-lut',
      },
      {
        _id: '6170e7f1ff4a36548ff2bac7',
        title: 'Văn bản hành chính',
        value: 'vn-bn-hnh-chnh',
      },
      {
        _id: '6170e7f1ff4a36548ff2bac6',
        title: 'Văn bản chuyên ngành',
        value: 'vn-bn-chuyn-ngnh',
      },
    ],
  },
  {
    title: 'Phương thức nhận',
    canDragDrop: false,
    code: 'S27',
    type: 'DocumentConfig',
    data: [
      {
        _id: '6170e6a392733754a18dcde9',
        title: 'Công văn giấy',
        value: 'cng-vn-giy',
      },
      {
        _id: '6170e84d92733754a18dce23',
        title: 'Công văn điện tử',
        value: 'cng-vn-in-t',
      },
    ],
  },
  // {
  //   title: 'Nguồn đơn',
  //   canDragDrop: false,
  //   code: 'S28',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Ký tên trên đơn',
  //   canDragDrop: false,
  //   code: 'S29',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Phân loại đơn',
  //   canDragDrop: false,
  //   code: 'S30',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Chức vụ',
  //   canDragDrop: false,
  //   code: 'S31',
  //   type: 'DocumentConfig',
  //   data: [
  //     {
  //       title: 'Bộ trưởng',
  //       value: 'b-trn',
  //     },
  //     {
  //       title: 'Thứ trưởng',
  //       value: 'th-trn',
  //     },
  //     {
  //       title: 'Cục trưởng',
  //       value: 'cc-trn',
  //     },
  //     {

  //       title: 'Phó cục trưởng',
  //       value: 'ph-cc-trng',
  //     },
  //     {
  //       title: 'Trưởng phòng',
  //       value: 'trng-phng',
  //     },
  //     {
  //       title: 'Phó trưởng phòng',
  //       value: 'ph-trng-phng',
  //     },
  //     {
  //       title: 'Cán bộ',
  //       value: 'cn-b',
  //     }
  //   ]
  // },
  // {
  //   title: 'Chức vụ đảng',
  //   canDragDrop: false,
  //   code: 'S32',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Đơn vị công tác',
  //   canDragDrop: false,
  //   code: 'S33',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Hình thức kỷ luật ban đầu',
  //   canDragDrop: false,
  //   code: 'S34',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Cấp quyết định kỷ luật',
  //   canDragDrop: false,
  //   code: 'S35',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Lĩnh vực công tác',
  //   canDragDrop: false,
  //   code: 'S36',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Cấp ủy viên',
  //   canDragDrop: false,
  //   code: 'S37',
  //   type: 'DocumentConfig',
  // },
  // {
  //   title: 'Chức vụ chính quyền',
  //   canDragDrop: false,
  //   code: 'S38',
  //   type: 'DocumentConfig',
  // },
  {
    title: 'Đơn vị gửi',
    canDragDrop: false,
    code: 'S39',
    type: 'DocumentConfig',
    data: [
      {
        _id: '617682415fb9a028100f355e',
        title: 'X06',
        value: 'x06',
      },
      {
        _id: '617a111b3710ef23fa2c281d',
        title: 'C06',
        value: 'c06',
      },
    ],
  },
  {
    title: 'Sổ VB đến',
    canDragDrop: false,
    type: 'DocumentConfig',
    extraFields: [
      {
        name: 'year',
        title: 'Năm',
      },
    ],
    data: [
      {
        extraValue: {
          Năm: '2022',
          year: '2021',
        },
        title: 'Sổ mật',
        value: 'somat',
      },
      {
        extraValue: {
          Năm: '2021',
          year: '2021',
        },
        title: 'Sổ thường',
        value: 'sothuong',
      },
      {
        title: 'so bt',
        value: 'so_bt',
      },
    ],
    code: 'S40',
  },
  // {
  //   title: 'Lĩnh vực khiếu tố',
  //   canDragDrop: false,
  //   type: 'DocumentConfig',
  //   extraFields: [
  //     {
  //       name: 'letterType',
  //       title: 'Loại đơn thư',
  //       type: 'Source|CrmSource,S30|Value||value',
  //       configType: 'crmSource',
  //       configCode: 'S30',
  //     },
  //     {
  //       name: 'unitType',
  //       title: 'Loại đơn vị',
  //       type: 'MenuItem',
  //       menuItem: [
  //         {
  //           code: 'ca-nhan',
  //           color: 'rgb(52, 11, 214)',
  //           name: 'Cá nhân',
  //           type: 'ca-nhan',
  //         },
  //         {
  //           code: 'to-chuc',
  //           color: 'rgb(52, 11, 214)',
  //           name: 'Tổ chức',
  //           type: 'to-chuc',
  //         },
  //       ],
  //     },
  //   ],
  //   code: 'S41',
  // },
  // {
  //   title: 'Kết quả xử lý',
  //   canDragDrop: false,
  //   type: 'DocumentConfig',
  //   code: 'S42',
  // },
  // {
  //   title: 'Kết quả lưu đơn',
  //   canDragDrop: false,
  //   type: 'DocumentConfig',
  //   code: 'S43',
  // },
  // {
  //   title: 'Cấp bậc',
  //   canDragDrop: false,
  //   type: 'DocumentConfig',
  //   code: 'S44',
  // },
  {
    title: 'Sổ VB đi',
    canDragDrop: false,
    type: 'DocumentConfig',
    code: 'so_VB_di',
    data: [
      {
        title: 'Sổ VB đi 1',
        value: 'SOD1',
      },
      {
        title: 'Sổ VB đi 2',
        value: 'SOD2',
      },
    ],
  },
  {
    title: 'Vai trò người dùng',
    canDragDrop: false,
    type: 'DocumentConfig',
    code: 'S300',
    data: [
      {
        title: 'Sơ loại văn bản',
        value: 'outlineDoc',
      },
      {
        title: 'Sơ loại lịch công tác',
        value: 'so_loai_lich',
      },
    ],
  },
  {
    title: 'Mức độ hoàn thành',
    canDragDrop: false,
    type: 'TaskConfig',
    code: 'S301',
    data: [
      {
        title: 'Tốt',
        value: 'tot',
      },
      {
        title: 'Khá',
        value: 'kha',
      },
      {
        title: 'Trung bình',
        value: 'TB',
      },
    ],
  },
  {
    title: 'Sổ văn bản',
    canDragDrop: false,
    type: 'DocumentConfig',
    code: 'S302',
    data: [
      {
        title: 'Sổ VB đến',
        value: 'SOVBDEN',
        moduleCode: {
          value: 'importIncommingDocument',
          api: '/api/importIncommingDocument',
          title: 'Văn bản đến',
          label: 'Module',
        },
      },
      {
        title: 'Sổ VB đi ',
        value: 'SOVBDI',
        moduleCode: {
          title: 'Văn bản đi',
          value: 'importOutgoingDocument',
          api: '/api/importOutgoingDocument',
          label: 'Module',
        },
      },
    ],
  },
  {
    title: 'Loại lịch công tác',
    canDragDrop: false,
    code: 'S600',
    type: 'CalendarConfig',
    data: [
      {
        title: 'Lịch thay đổi',
        value: 'lich-thay-doi',
      },
      {
        title: 'Hoãn',
        value: 'hoan',
      },
      {
        title: 'Lịch bổ sung',
        value: 'lich-bo-sung',
      },
      {
        title: 'Dự kiến',
        value: 'du-kien',
      },
    ],
  },
  {
    title: 'Đồng chí trực',
    canDragDrop: false,
    code: 'truc chi huy',
    type: 'CalendarConfig',
    data: [
      {
        title: 'Trực chỉ huy',
        value: 'truc chi huy',
      },
    ],
  },
  {
    title: 'Nơi nhận lịch tuần',
    canDragDrop: false,
    code: 'truc chi huy',
    type: 'CalendarConfig',
    data: [
      {
        title: 'Nơi nhận1',
        value: 'Nơi nhận1',
      },
      {
        title: 'Nơi nhận2',
        value: 'Nơi nhận2',
      },
      {
        title: 'Nơi nhận3',
        value: 'Nơi nhận3',
      },
      {
        title: 'Nơi nhận4',
        value: 'Nơi nhận4',
      },
    ],
  },
  {
    title: 'Chức vụ ký',
    canDragDrop: false,
    code: 'chuc vu ky',
    type: 'CalendarConfig',
    data: [
      {
        title: 'Chức vụ ký 1',
        value: 'Chức vụ ký 1',
      },
      {
        title: 'Chức vụ ký 2',
        value: 'Chức vụ ký 2',
      },
    ],
  },
  {
    title: 'Nguời ký',
    canDragDrop: false,
    code: 'nguời ky',
    type: 'CalendarConfig',
    data: [
      {
        title: 'Tên người ký',
        value: 'Tên người ký',
      },
    ],
  },
  {
    title: 'Tên cục',
    canDragDrop: false,
    code: 'cuc cong nghe thong tin',
    type: 'CalendarConfig',
    data: [
      {
        title: 'Cục công nghệ thông tin',
        value: 'Cục công nghệ thông tin',
      },
    ],
  },
  {
    title: 'Số cục',
    canDragDrop: false,
    code: 'so',
    type: 'CalendarConfig',
    data: [
      {
        title: 'Số cục',
        value: 'Số cục',
      },
    ],
  },
];

module.exports = {
  crmSource,
};
