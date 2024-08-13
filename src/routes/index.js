const incommingDocumentRoute = require('../modules/incommingDocument/incommingDocument.route');
const outgoingDocumentRoute = require('../modules/outgoingDocument/outgoingDocument.route');

const routes = (app) => {
  app.use('api/incommingDocument/', incommingDocumentRoute);
  app.use('api/outgoingDocument/', outgoingDocumentRoute);
};
module.exports = routes;
