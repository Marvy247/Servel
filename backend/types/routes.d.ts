declare module '*/routes/auth' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module '*/routes/github' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module '*/routes/dashboard' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module '*/middleware/errorHandler' {
  import { ErrorRequestHandler } from 'express';
  const errorHandler: ErrorRequestHandler;
  export { errorHandler };
}

declare module '*/middleware/auth' {
  import { RequestHandler } from 'express';
  const requireAuth: RequestHandler;
  export { requireAuth };
}
