import { IncomingMessage, ServerResponse } from 'http';

export interface Request extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: {
    userId: number;
    githubId: string;
    githubUsername: string;
  };
}

export interface Response extends ServerResponse {
  json: (data: any, status?: number) => void;
  error: (message: string, status?: number) => void;
}

export type Handler = (req: Request, res: Response) => Promise<void> | void;
export type Middleware = (req: Request, res: Response, next: () => void) => Promise<void> | void;
