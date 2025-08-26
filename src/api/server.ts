// user\src\api\server.ts

import app from "@nihil_backend/user/api/config.js";
import { prisma } from "@nihil_backend/user/infrastructure/prisma.js";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 User Service API running on port ${PORT}`);
});

const shutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (e) {
    console.error("Prisma disconnect failed:", e);
  } finally {
    server.close(() => process.exit(0));
  }
};

["SIGINT", "SIGTERM"].forEach((sig) =>
  process.on(sig, () => {
    void shutdown();
  }),
);
