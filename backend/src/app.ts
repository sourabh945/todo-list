import express from "express";
import pinoHttp from "pino-http";
import logger from "./utils/logger";
import globalErrorHandler from "./middleware/errorMiddleware";

const app = express();

// This middleware assigns a unique 'req.id' to every request
// and logs when the request starts and when the response finishes.
app.use(pinoHttp({ logger }));

app.use(express.json());

// ... your routes ...

app.use(globalErrorHandler);
