import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Request, Response, Handler, Middleware } from './types.js';
import { errorHandler } from './middleware/errorHandler.js';

type Route = {
  method: string;
  path: string;
  handler: Handler;
  middleware: Middleware[];
};

export class Server {
  private routes: Route[] = [];

  private enhanceResponse(res: ServerResponse): Response {
    const enhanced = res as Response;
    enhanced.json = (data: any, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    enhanced.error = (message: string, status = 500) => {
      enhanced.json({ error: message }, status);
    };
    return enhanced;
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  }

  post(path: string, ...handlers: (Handler | Middleware)[]): void {
    const middleware = handlers.slice(0, -1) as Middleware[];
    const handler = handlers[handlers.length - 1] as Handler;
    this.routes.push({ method: 'POST', path, handler, middleware });
  }

  get(path: string, ...handlers: (Handler | Middleware)[]): void {
    const middleware = handlers.slice(0, -1) as Middleware[];
    const handler = handlers[handlers.length - 1] as Handler;
    this.routes.push({ method: 'GET', path, handler, middleware });
  }

  private async runMiddleware(middleware: Middleware[], req: Request, res: Response): Promise<boolean> {
    for (const mw of middleware) {
      let nextCalled = false;
      await mw(req, res, () => { nextCalled = true; });
      if (!nextCalled) return false;
    }
    return true;
  }

  listen(port: number): void {
    const server = createServer(async (incoming, outgoing) => {
      const req = incoming as Request;
      const res = this.enhanceResponse(outgoing);

      req.body = await this.parseBody(incoming);

      const route = this.routes.find(
        (r) => r.method === req.method && r.path === req.url
      );

      if (!route) {
        res.error('Not found', 404);
        return;
      }

      try {
        const canProceed = await this.runMiddleware(route.middleware, req, res);
        if (canProceed) {
          await route.handler(req, res);
        }
      } catch (error) {
        errorHandler(error as Error, req, res);
      }
    });

    server.listen(port, () => {
      console.log(`API server listening on port ${port}`);
    });
  }
}
