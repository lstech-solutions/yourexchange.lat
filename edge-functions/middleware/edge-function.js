// This is a simple edge function that will be used as a passthrough
// since we're handling the middleware in the Next.js application

export default async (request, context) => {
  // Just pass the request through to the Next.js middleware
  return await context.next();
};

export const config = {
  path: '/*',
  excludedPath: ['/api/*', '/_next/*', '/static/*']
};
