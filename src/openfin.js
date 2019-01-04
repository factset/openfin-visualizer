const { ipcMain } = require('electron');
const { connect } = require('hadouken-js-adapter');

exports = module.exports = new OpenFin();

let runtimes = {};

function OpenFin() {}

ipcMain.on('openfin-connect', async (event, data) => {
  let version = await Connect(data.runtime);
  event.sender.send('openfin-connected', { runtime: data.runtime, version: version});
});

ipcMain.on('openfin-disconnect', (event, data) => {
  event.returnValue = Disconnect(data.runtime);
});

async function Connect(runtime) {
  let options = {
    uuid: `openfin-visualizer-${runtime}`,
    runtime: { version: runtime }
  };

  let fin = await connect(options).catch(err => console.error(err));
  let version = await fin.System.getVersion();
  runtimes[runtime] = fin;
  console.log(`Connected to OpenFin version ${version} with runtime ${runtime}`);
  return version;
}

async function Disconnect(runtime) {
  let fin = runtimes[runtime];
  await fin.System.exit(() => {
    console.log(`Disconnected from OpenFin runtime ${runtime}`);
    return runtime;
  }, err => {
    console.log(err);
    return err;
  });
}

exports.disconnectAll = async () => {
  for (let runtime in runtimes) {
    // Await disconnect call to ensure OpenFin receives the command
    await Disconnect(runtime);
  }
}
