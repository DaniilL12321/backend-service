import serverless from 'serverless-http';
import { createApp } from '../src/main';

type ServerlessRequest = { [key: string]: unknown };
type ServerlessResponse = { [key: string]: unknown };

let handler:
  | ((req: ServerlessRequest, res: ServerlessResponse) => Promise<unknown>)
  | null = null;

async function getHandler() {
  if (handler) {
    return handler;
  }

  const app = await createApp();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();

  handler = serverless(expressApp) as (
    req: ServerlessRequest,
    res: ServerlessResponse,
  ) => Promise<unknown>;

  return handler;
}

export default async function vercelHandler(
  req: ServerlessRequest,
  res: ServerlessResponse,
) {
  const currentHandler = await getHandler();
  return currentHandler(req, res);
}
