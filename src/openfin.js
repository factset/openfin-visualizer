const { ipcMain } = require('electron');
const { connect } = require('hadouken-js-adapter');

exports = module.exports = new OpenFin();

let runtimes = {};

function OpenFin() {}

ipcMain.on('openfin-connect', async (event, data) => {
  let version = await Connect(data.runtime);
  event.sender.send('openfin-connected', { runtime: data.runtime, version: version });
});

ipcMain.on('openfin-disconnect', async (event, data) => {
  let version = await Disconnect(data.runtime);
  event.sender.send('openfin-disconnected', { runtime: data.runtime });
});

/*ipcMain.on('openfin-disconnect-all', async event => {
  // TODO* utilize already existing exports
  for (let runtime in runtimes) {
    // Await disconnect call to ensure OpenFin receives the command
    console.log(`Disconnecting from ${runtime}`);
    await Disconnect(runtime);
  }
  event.sender.send('openfin-disconnected-all');
});*/

ipcMain.on('openfin-subscribe', async (event, data) => {
  await Subscribe(event.sender, data.runtime, data.uuid, data.topic);
});

ipcMain.on('openfin-publish', async (event, data) => {
  await Publish(event.sender, data.runtime, data.topic, data.data);
});

ipcMain.on('openfin-send', async (event, data) => {
  await Send(event.sender, data.runtime, data.uuid, data.topic, data.data);
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
    return runtime;
  });
}

async function Subscribe(sender, runtime, targetUuid, topic) {
  await runtimes[runtime].InterApplicationBus.subscribe({ uuid: targetUuid }, topic, (data, uuid, name) => {
    sender.send('openfin-subscribed', {
      runtime: runtime,
      targetUuid: targetUuid,
      uuid: uuid,
      topic: topic,
      message: JSON.stringify(data)
    });
  }).then(() => {
    console.log(`Subscribed to uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);
  }).catch(err => {
    console.log(err);
    sender.send('openfin-subscribe-error', { data: err });
  });
}

async function Publish(sender, runtime, topic, data) {
  await runtimes[runtime].InterApplicationBus.publish(topic, data).then(() => {
    console.log(`Published data [${data}] on channel [${runtime}] with topic [${topic}]`);
  }).catch(err =>  {
    console.log(err);
    sender.send('openfin-publish-error', { data: err });
  });
}

// TODO* not yet working for some reason...
async function Send(sender, runtime, targetUuid, topic, data) {
  await runtimes[runtime].InterApplicationBus.send(targetUuid, topic, data).then(() => {
    console.log(`Sent data [${data}] to uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);
  }).catch(err =>  {
    console.log(err);
    sender.send('openfin-send-error', { data: err });
  });
}

// TODO* getProcessList -> get all objects on current runtime
// OR: getAll[External]Applications for generic application info (uuid, isRunning, and parentUuid)

exports.disconnectAll = async () => {
  for (let runtime in runtimes) {
    // Await disconnect call to ensure OpenFin receives the command
    console.log(`Disconnecting from ${runtime}`);
    await Disconnect(runtime);
  }
}
