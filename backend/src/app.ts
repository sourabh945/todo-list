import express from "express";
import pinoHttp from "pino-http";
import logger from "./utils/logger.global.util";
import globalErrorHandler from "./middleware/error.middleware";

const app = express();

// This middleware assigns a unique 'req.id' to every request
// and logs when the request starts and when the response finishes.
app.use(pinoHttp({ logger }));

app.use(express.json());

// ... your routes ...

import AuthRoutes from "./routes/auth.routes";

app.use("/api/v1/auth", AuthRoutes);

// ... end routes ...

app.use(globalErrorHandler);

export default app;
