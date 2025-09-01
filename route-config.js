/** @type {import('next').RouteConfig} */
const routeConfig = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
  // Disable Edge Runtime for all routes
  runtime: 'nodejs',
};

export default routeConfig;
