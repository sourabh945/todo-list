// this file contains the logger configuration for the application
//

import pino from "pino";

const pinoTargets: pino.TransportTargetOptions[] = [
  {
    target: "pino/file", //add the file target for the log file
    options: {
      destination: process.env.LOG_FILE_PATH ?? "./.app.logs",
      mkdir: true,
    },
    level: process.env.FILE_LOG_LEVEL ?? process.env.LOG_LEVEL ?? "info",
  },
];

//check the permission to print in the terminal
if (process.env.TERMINAL_LOG == "allow") {
  pinoTargets.push({
    target: "pino-pretty",
    options: {
      colorize: true,
    },
    level: process.env.TERMINAL_LOG_LEVEL ?? process.env.LOG_LEVEL ?? "info",
  });
}

const transport = pino.transport({
  targets: pinoTargets,
});

const logger = pino(transport);

export default logger;
