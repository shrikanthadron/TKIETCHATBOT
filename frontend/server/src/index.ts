import "dotenv/config";
import { app } from "./app.js";

const PORT = process.env.PORT || 4000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`LearnIQ API running on http://localhost:${PORT}`);
  });
}
