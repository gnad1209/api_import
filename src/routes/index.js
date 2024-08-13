// const incommingDocumentRoute = require('../modules/incommingDocument/incommingDocument.route');
const outgoingDocumentRoute = require('../modules/outgoingDocument/outgoingDocument.route');

const routes = (app) => {
    // app.use('/incommingDocument/', incommingDocumentRoute)
    app.use('/outgoingDocument/', outgoingDocumentRoute)
}
module.exports = routes