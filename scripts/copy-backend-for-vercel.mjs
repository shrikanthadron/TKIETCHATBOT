import "./sync-server-to-frontend.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "frontend", "server", "src");
const dest = path.join(root, "frontend", "src", "backend-api");

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Copied frontend/server/src -> frontend/src/backend-api");
