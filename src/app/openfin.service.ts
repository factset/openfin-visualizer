import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class OpenfinService {

  private ipc: any;

  private runtimes: any = {}; // used for storing active runtimes
  private subscriptions: any = {}; // used for storing active subscriptions

  constructor(private _electronService: ElectronService) {
    this.ipc = _electronService.ipcRenderer;

    this.ipc.on('openfin-connected', (event, data) => {
      this.connected(data.runtime, data.version);
    });

    this.ipc.on('openfin-disconnected', (event, data) => {
      this.disconnected(data.runtime);
    });

    this.ipc.on('openfin-disconnected-all', event => {
      this.disconnectedAll();
    })

    this.ipc.on('openfin-subscribed', (event, data) => {
      this.subscribed(data.runtime, data.targetUuid, data.uuid, data.topic, data.message);
    });

    this.ipc.on('openfin-unsubscribed', (event, data) => {
      this.unsubscribed(data.runtime, data.uuid, data.topic);
    });
  }


  // Send Events

  connect(runtime: string): Observable<any> {
    this.runtimes[runtime] = new Subject<any>();
    this.ipc.send('openfin-connect', { runtime: runtime });
    return this.runtimes[runtime].asObservable();
  }

  disconnect(runtime: string) {
    this.ipc.send('openfin-disconnect', { runtime: runtime });
  }

  disconnectAll() {
    this.ipc.send('openfin-disconnect-all');
  }

  // in this case, UUID represents the target for the subscription (not the sender)
  subscribe(runtime: string, uuid: string, topic: string): Observable<any> {
    if (!this.subscriptions[runtime].hasOwnProperty(topic)) {
      this.subscriptions[runtime][topic] = {};
    }
    this.subscriptions[runtime][topic][uuid] = new Subject<any>();
    this.ipc.send('openfin-subscribe', { runtime: runtime, uuid: uuid, topic: topic });
    return this.subscriptions[runtime][topic][uuid].asObservable();
  }

  unsubscribe(runtime: string, uuid: string, topic: string) {
    this.ipc.send('openfin-unsubscribe', { runtime: runtime, uuid: uuid, topic: topic });
  }

  // TODO* create and return observable in case error occurs
  publish(runtime: string, topic: string, data: any) {
    this.ipc.send('openfin-publish', { runtime: runtime, topic: topic, data: data });
  }

  // TODO* create and return observable in case error occurs
  send(runtime: string, uuid: string, topic: string, data: any) {
    this.ipc.send('openfin-send', { runtime: runtime, uuid: uuid, topic: topic, data: data });
  }


  // Receive Events

  connected(runtime: string, version: string) {
    this.subscriptions[runtime] = {};
    this.runtimes[runtime].next({ version: version });
    this.ipc.send('openfin-get-applications', { runtime: runtime });
  }

  disconnected(runtime: string) {
    //this.runtimes[runtime].observable.next({ version: null });
    delete this.runtimes[runtime];
  }

  disconnectedAll() {
    this.runtimes = {};
  }

  subscribed(runtime: string, targetUuid: string, uuid: string, topic: string, message: string) {
    this.subscriptions[runtime][topic][targetUuid].next({
      sender: uuid,
      message: message
    });
    console.log(this.subscriptions);
    console.log(`${runtime} ${targetUuid} ${uuid} ${topic}`);
  }

  unsubscribed(runtime: string, uuid: string, topic: string) {
    delete this.subscriptions[runtime][topic][uuid];
    if (Object.keys(this.subscriptions[runtime][topic]).length === 0) {
      delete this.subscriptions[runtime][topic];
    }
  }


  // Helper Functions

}
