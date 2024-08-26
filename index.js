const express = require('express');
const routes = require('./src/routes/index');
const { connectToDatabase } = require('./src/config/db');
const morgan = require('morgan');

connectToDatabase();
const app = express();
const port = process.env.PORT || 9000;

app.use(morgan('dev'));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/', routes);

app.listen(port, () => {
  console.log(`server is running with port: ${port}`);
});


// toBook               :Số, ký hiệu văn bản                    : Số, ký hiệu văn bản
// abstractNote         :Trích yếu(*)                           : Trích yếu
// urgencyLevel         :Độ khẩn                                : thng
// senderUnit           :Đơn vị soạn thảo(*)                    : CATPHN
// documentType         :Loại văn bản                           : Congvan 
// releaseDate          :Ngày ban hành                          : "2024/08/16
// releaseNo            :Số văn bản đi                          : Số văn bản đi
// documentField        :Lĩnh vực                               : vn-bn-quy-phm-php-lut
// privateLevel         :Độ mật                                 : mt
// currentNote          :Nội dung xử lý                         : Nội dung xử lý
// incommingDocument    :Phúc đáp văn bản (Nhập mã Văn bản đến) : c2
// tasks                :Công việc liên quan                    : Nhập mã Hồ sơ công việc
// autoReleaseCheck     :Tự động ban hành                       : true
// caSignCheck          :Ký CA                                  : true
// currentRole          :Vai trò                                : Vai trò
// nextRole             :Vai trò tiếp theo                      : Vai trò tiếp theo


