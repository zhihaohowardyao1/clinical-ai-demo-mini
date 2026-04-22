export function createLogger(requestId) {
  function format(level, message, extra = {}) {
    return JSON.stringify({
      ts: new Date().toISOString(),
      level,
      requestId,
      message,
      ...extra
    });
  }

  return {
    info(message, extra) {
      console.log(format("info", message, extra));
    },
    warn(message, extra) {
      console.warn(format("warn", message, extra));
    },
    error(message, extra) {
      console.error(format("error", message, extra));
    }
  };
}
