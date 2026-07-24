import express from "express";
import cors from "cors";
import helmet from "helmet"

import { env } from "./config/env.js";
import { API_PREFIX } from "./config/constants.js";
import routes from "./routes/index.js"
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";

const app = express();
app.use(helmet());
app.use(cors())
app.use(express.json());

app.use(API_PREFIX,routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware)

const PORT = process.env.PORT || 5000;



app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
})