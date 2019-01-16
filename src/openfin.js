const { ipcMain } = require('electron');
const { connect } = require('hadouken-js-adapter');

exports = module.exports = new OpenFin();

let runtimes = {}; // used for fin object storage

let request = {}; // used for passing information to listeners

function OpenFin() {}


// IPC Listeners

ipcMain.on('openfin-connect', async (event, data) => {
  let version = await Connect(data.runtime);
  event.sender.send('openfin-connected', { runtime: data.runtime, version: version });
});

ipcMain.on('openfin-disconnect', async (event, data) => {
  await Disconnect(data.runtime);
  event.sender.send('openfin-disconnected', { runtime: data.runtime });
});

ipcMain.on('openfin-disconnect-all', async event => {
  await exports.disconnectAll();
});

ipcMain.on('openfin-subscribe', async (event, data) => {
  await Subscribe(event.sender, data.runtime, data.uuid, data.topic);
});

ipcMain.on('openfin-unsubscribe', async (event, data) => {
  await Unsubscribe(data.runtime, data.uuid, data.topic);
  event.sender.send('openfin-unsubscribed', { runtime: data.runtime, uuid: data.uuid, topic: data.topic });
});

ipcMain.on('openfin-unsubscribe-all', async (event, data) => {
  // TODO* find a way to unsubscribe from all
});

ipcMain.on('openfin-publish', async (event, data) => {
  await Publish(event.sender, data.runtime, data.topic, data.data);
});

ipcMain.on('openfin-send', async (event, data) => {
  await Send(event.sender, data.runtime, data.uuid, data.topic, data.data);
});


// OpenFin Functions

async function Connect(runtime) {
  let options = {
    uuid: `openfin-visualizer-${runtime}`,
    name: `openfin-visualizer-${runtime}`,
    runtime: { version: runtime }
  };

  let version;
  try {
    let fin = await connect(options);
    version = await fin.System.getVersion();
    runtimes[runtime] = fin;
    console.log(`Connected to OpenFin version ${version} with runtime ${runtime}`);
  } catch(e) {
    console.log(e);
    let body = `Could not connect`;
    sender.send('error', { service: 'openfin', body: content, data: err });
  }
  return version;
}

async function Disconnect(runtime) {
  try {
    // Call private method (for now) to disconnect from RVM
    await runtimes[runtime].wire.wire.shutdown();
    console.log(`Disconnected from OpenFin runtime ${runtime}`);
    delete runtimes[runtime];
  } catch(e) {
    console.log(e);
    let body = `Could not disconnect`;
    sender.send('error', { service: 'openfin', body: content, data: err });
  }
}

async function Subscribe(sender, runtime, targetUuid, topic) {
  request = {
    sender: sender,
    runtime: runtime,
    targetUuid: targetUuid,
    topic: topic
  };

  await runtimes[runtime].InterApplicationBus.subscribe(
    { uuid: targetUuid },
    topic,
    subscriptionListener
  ).then(() => {
    console.log(`Subscribed to uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);
  }).catch(err => {
    console.log(err);
    let body = `Could not subscribe`;
    sender.send('error', { service: 'openfin', body: content, data: err });
  });
}

async function Unsubscribe(runtime, targetUuid, topic) {
  await runtimes[runtime].InterApplicationBus.unsubscribe(
    { uuid: targetUuid },
    topic,
    subscriptionListener
  ).then(() => {
    console.log(`Unsubscribed from uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);
  }).catch(err => {
    console.log(err);
    let body = `Could not unsubscribe`;
    sender.send('error', { service: 'openfin', body: content, data: err });
  });
}

async function Publish(sender, runtime, topic, data) {
  await runtimes[runtime].InterApplicationBus.publish(topic, data).then(() => {
    console.log(`Published data [${data}] on channel [${runtime}] with topic [${topic}]`);
  }).catch(err =>  {
    console.log(err);
    let body = `Could not publish`;
    sender.send('error', { service: 'openfin', body: content, data: err });
  });
}

// TODO* not yet working for some reason...
async function Send(sender, runtime, targetUuid, topic, data) {
  await runtimes[runtime].InterApplicationBus.send({ uuid: targetUuid }, topic, data).then(() => {
    console.log(`Sent data [${data}] to uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);
  }).catch(err =>  {
    console.log(err);
    let body = `Could not send`;
    sender.send('error', { service: 'openfin', body: content, data: err });
  });
}


// Listeners

let subscriptionListener = (data, uuid, name) => {
  request.sender.send('openfin-subscribed', {
    runtime: request.runtime,
    targetUuid: request.targetUuid,
    uuid: uuid,
    topic: request.topic,
    message: JSON.stringify(data)
  });
}


// Exported functions

exports.disconnectAll = async () => {
  for (let runtime in runtimes) {
    console.log(`Disconnecting from ${runtime}`);
    await Disconnect(runtime);
  }
}
