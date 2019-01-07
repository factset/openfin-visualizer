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
      this.disconnected(data.runtime, data.version);
    });

    this.ipc.on('openfin-subscribed', (event, data) => {
      console.log('Received data: ' + data);
      this.subscribed(data.runtime, data.targetUuid, data.uuid, data.topic, data.message);
    });
  }

  // Send Events
  connect(runtime: string): Observable<any> {
    this.runtimes[runtime] = {};
    this.runtimes[runtime].observable = new Subject<any>();
    this.runtimes[runtime].topics = {};
    this.ipc.send('openfin-connect', { runtime: runtime });
    return this.runtimes[runtime].observable.asObservable();
  }

  disconnect(runtime: string) {
    this.ipc.send('openfin-disconnect', { runtime: runtime });
  }

  subscribe(runtime: string, uuid: string, topic: string): Observable<any> {
    this.runtimes[runtime].topics[topic] = {};
    this.runtimes[runtime].topics[topic][uuid] = new Subject<any>();
    this.ipc.send('openfin-subscribe', { runtime: runtime, uuid: uuid, topic: topic });
    return this.runtimes[runtime].topics[topic][uuid].asObservable();
  }

  unsubscribe(runtime: string, uuid: string, topic: string) {
    this.ipc.send('openfin-unsubscribe', { runtime: runtime, uuid: uuid, topic: topic });
  }

  // Receive Events
  connected(runtime: string, version: string) {
    this.runtimes[runtime].observable.next({ version: version });
  }

  disconnected(runtime: string, version: string) {
    //this.observables.runtimes[runtime].next({ version: })
  }

  subscribed(runtime: string, targetUuid: string, uuid: string, topic: string, message: string) {
    this.runtimes[runtime].topics[topic][targetUuid].next({
      sender: uuid,
      message: message
    });
  }
}
