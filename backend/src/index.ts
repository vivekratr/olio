import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./common/config/env.js";
import { API_PREFIX } from "./common/config/constants.js";
import { logger } from "./common/logger/logger.js";
import routes from "./routes/index.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";
import { notFoundMiddleware } from "./common/middlewares/not-found.middleware.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(API_PREFIX, routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
