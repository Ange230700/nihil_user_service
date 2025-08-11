// user\src\api\server.ts

import app from "@nihil_backend/user/api/config.js";
import { prisma } from "@nihil_backend/user/infrastructure/prisma.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};
["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, shutdown));
