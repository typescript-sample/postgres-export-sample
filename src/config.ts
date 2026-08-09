export const config = {
  service: "export-user",
  log: {
    level: "DEBUG",
    map: {
      time: "@timestamp",
      msg: "message",
    },
    db: true,
  },
  file: {
    path: "./out_dir/",
    prefix: "user_",
  },
  db: {
    connectionString: "postgres://postgres:abcd1234@localhost/masterdata",
  },
  error: {
    directory: "./log/",
    prefix: "error_",
    suffix: ".txt",
  },
  info: {
    directory: "./log/",
    prefix: "log_",
    suffix: ".txt",
  },
}

export const environments = {
  sit: {
    log: {
      level: "INFO",
      db: false,
    },
  },
  prd: {
    log: {
      level: "INFO",
      db: false,
    },
  },
}
