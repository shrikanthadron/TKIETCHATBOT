import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(frontendRoot, "server", "src");
const dest = path.join(frontendRoot, "src", "backend-api");

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Prepared frontend/src/backend-api for Vercel");
