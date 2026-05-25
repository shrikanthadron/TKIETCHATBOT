import "dotenv/config";
import type { NextApiRequest, NextApiResponse } from "next";
import serverless from "serverless-http";
import { app } from "@/backend-api/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
  // Vercel serverless max duration (seconds) for Express API handler
  maxDuration: 60,
};

const handler = serverless(app, {
  binary: ["image/*", "application/pdf"],
});

export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  return handler(req, res);
}
