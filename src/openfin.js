const { ipcMain } = require('electron');
const { connect } = require('hadouken-js-adapter');

exports = module.exports = new OpenFin();

let runtimes = {};
let versions = {};
let subscriptions = {};
let processes = {};

function OpenFin() {}

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

ipcMain.on('openfin-get-process', async (event, data) => {
  await GetProcessInfo(event.sender, data.runtime, data.uuid);
});

ipcMain.on('openfin-get-applications', async (event, data) => {
  await GetAllApplications(event.sender, data.runtime);
});

// Restore current runtimes
ipcMain.on('openfin-restore-runtimes', event => {
  event.returnValue = versions;
});

// Restore current subscriptions
ipcMain.on('openfin-restore-subscriptions', event => {
  event.returnValue = subscriptions;
});

async function Connect(runtime) {
  let options = {
    uuid: `openfin-visualizer-${runtime}`,
    runtime: { version: runtime }
  };

  let version;
  try {
    let fin = await connect(options);

    // Maybe create secondary OF application (via Application.create()) and
    // add event listeners
    version = await fin.System.getVersion();
    runtimes[runtime] = fin;
    versions[runtime] = version;
    console.log(`Connected to OpenFin version ${version} with runtime ${runtime}`);
  } catch(e) {
    console.log(e);
  }
  return version;
}

async function Disconnect(runtime) {
  try {
    // Call private method (for now) to disconnect from RVM
    await runtimes[runtime].wire.wire.shutdown();
    console.log(`Disconnected from OpenFin runtime ${runtime}`);
    delete runtimes[runtime];
    delete versions[runtime]; // TODO* check if exists
  } catch(e) {
    console.log(e);
  }
}

async function Subscribe(sender, runtime, targetUuid, topic) {
  if (!subscriptions.hasOwnProperty(runtime)) subscriptions[runtime] = [];
  let sub = subscriptions[runtime].find(s => {
    return s.uuid === targetUuid && s.topic === topic;
  });

  if (sub) {
    console.log(`Subscription already exists for uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);
  } else {
    await runtimes[runtime].InterApplicationBus.subscribe({ uuid: targetUuid }, topic, (data, uuid, name) => {
      sender.send('openfin-subscribed', {
        runtime: runtime,
        targetUuid: targetUuid,
        uuid: uuid,
        topic: topic,
        message: JSON.stringify(data)
      });
    }).then(() => {
      // Push subscription
      subscriptions[runtime].push({ uuid: targetUuid, topic: topic });
      console.log(`Subscribed to uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);
    }).catch(err => {
      console.log(err);
      sender.send('openfin-subscribe-error', { data: err });
    });
  }
}

// TODO* this is not working :( maybe check uuid or something
async function Unsubscribe(runtime, targetUuid, topic) {
  await runtimes[runtime].InterApplicationBus.unsubscribe({ uuid: targetUuid }, topic, () => {}).then(() => {
    console.log(`Unsubscribed from uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);

    // Destroy subscription
    subscriptions[runtime] = subscriptions[runtime].filter(s => {
      return s.uuid !== targetUuid || s.topic !== topic;
    });
    if (subscriptions[runtime].length === 0) delete subscriptions[runtime];
  }).catch(err => {
    console.log(err);
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
  await runtimes[runtime].InterApplicationBus.send({ uuid: targetUuid }, topic, data).then(() => {
    console.log(`Sent data [${data}] to uuid [${targetUuid}] on channel [${runtime}] with topic [${topic}]`);
  }).catch(err =>  {
    console.log(err);
    sender.send('openfin-send-error', { data: err });
  });
}

// TODO* getProcessList -> get all objects on current runtime
// OR: getAll[External]Applications for generic application info (uuid, isRunning, and parentUuid)
// TODO* the function is successfully called but getProcessList() is not
async function GetProcessInfo(sender, runtime, uuid) {
  await runtimes[runtime].System.getProcessList().then(list => {
    let info = list.find(process => {
      return process.uuid === uuid;
    });
    sender.send('openfin-got-process', { runtime: runtime, uuid: uuid, info: info });
  });
}

async function GetAllApplications(sender, runtime) {
  await runtimes[runtime].System.getAllApplications(apps => {
    console.log('App');
    apps.forEach(app => console.log('App: ' + app.uuid));
  });
  await runtimes[runtime].System.getAllExternalApplications(apps => {
    console.log('Ext');
    apps.forEach(app => console.log('Ext: ' + app.uuid));
  });
}

exports.disconnectAll = async () => {
  for (let runtime in runtimes) {
    // Await disconnect call to ensure OpenFin receives the command
    console.log(`Disconnecting from ${runtime}`);
    await Disconnect(runtime);
  }
}
