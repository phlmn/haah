export async function onExit(
  callback: (options: { exit?: boolean }, code: number) => void,
) {
  // from https://stackoverflow.com/a/14032965

  // so the program will not close instantly
  process.stdin.resume();

  function exitHandler(options: { exit?: boolean }, exitCode: number) {
    callback && callback(options, exitCode);

    if (options.exit) process.exit(exitCode);
  }

  function exceptionHandler(error: any) {
    console.error('Unhandled exception:', error);
    callback && callback({ exit: true }, 1);

    process.exit(1);
  }

  // do something when app is closing
  process.on('exit', exitHandler.bind(null, {}));

  // catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

  // catches uncaught exceptions
  process.on('uncaughtException', exceptionHandler);
}
