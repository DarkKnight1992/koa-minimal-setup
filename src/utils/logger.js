import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf } = format;

const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

let transportsOptions = [
  new transports.Console(),
  new transports.File({ filename: "logs/server.log" })
];
if(process.env.NODE_ENV !== "development" ) {
  transportsOptions = [
    new transports.File({ filename: "logs/server_error.log" })
  ];
}

const logger = createLogger({
  level: process.env.NODE_ENV === "development" ? "info" : "warn",
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: transportsOptions
});

export default logger;