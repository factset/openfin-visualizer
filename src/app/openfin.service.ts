import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class OpenfinService {

  private ipc: any;
  private runtimes: any = {};

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

    this.ipc.on('openfin-got-process', (event, data) => {
      console.log(data);
      this.processReceived(data.runtime, data.uuid, data.info);
    });
  }

  // Send Events
  connect(runtime: string): Observable<any> {
    this.runtimes[runtime] = {};
    this.runtimes[runtime].observable = new Subject<any>();
    this.runtimes[runtime].topics = {};
    this.runtimes[runtime].info = {};
    this.ipc.send('openfin-connect', { runtime: runtime });
    return this.runtimes[runtime].observable.asObservable();
  }

  disconnect(runtime: string) {
    this.ipc.send('openfin-disconnect', { runtime: runtime });
  }

  disconnectAll() {
    this.ipc.send('openfin-disconnect-all');
  }

  // in this case, UUID represents the target for the subscription (not the sender)
  subscribe(runtime: string, uuid: string, topic: string): Observable<any> {
    if (!this.runtimes[runtime].topics.hasOwnProperty(topic)) {
      this.runtimes[runtime].topics[topic] = {};
    }
    this.runtimes[runtime].topics[topic][uuid] = new Subject<any>();
    this.ipc.send('openfin-subscribe', { runtime: runtime, uuid: uuid, topic: topic });
    return this.runtimes[runtime].topics[topic][uuid].asObservable();
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

  getProcess(runtime: string, uuid: string): Observable<any> {
    this.runtimes[runtime].info[uuid] = new Subject<any>();
    this.ipc.send('openfin-get-process', { runtime: runtime, uuid: uuid });
    return this.runtimes[runtime].info[uuid].asObservable();
  }


  // Receive Events
  connected(runtime: string, version: string) {
    this.runtimes[runtime].observable.next({ version: version });
  }

  disconnected(runtime: string) {
    //this.runtimes[runtime].observable.next({ version: null });
    delete this.runtimes[runtime];
  }

  disconnectedAll() {
    this.runtimes = {};
  }

  subscribed(runtime: string, targetUuid: string, uuid: string, topic: string, message: string) {
    this.runtimes[runtime].topics[topic][targetUuid].next({
      sender: uuid,
      message: message
    });
  }

  unsubscribed(runtime: string, uuid: string, topic: string) {
    delete this.runtimes[runtime].topics[topic][uuid];
    if (Object.keys(this.runtimes[runtime].topics[topic]).length === 0) {
      delete this.runtimes[runtime].topics[topic];
    }
  }

  processReceived(runtime: string, uuid: string, info: any) {
    this.runtimes[runtime].info[uuid].next({
      info: info
    });
  }
}
