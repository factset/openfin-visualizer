import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class OpenfinService {

  private ipc: any;
  private observables: any = {
    runtimes: {},
    topics: {}
  };

  constructor(private _electronService: ElectronService) {
    this.ipc = _electronService.ipcRenderer;

    this.ipc.on('openfin-connected', (event, data) => {
      this.connected(data.runtime, data.version);
    });
    //this.ipc.on('openfin-receive')
  }

  // Send Events
  connect(runtime: string): Observable<any> {
    this.observables.runtimes[runtime] = new Subject<any>();
    this.ipc.send('openfin-connect', { runtime: runtime });
    return this.observables.runtimes[runtime].asObservable();
  }

  disconnect(runtime: string) {
    return this.ipc.sendSync('openfin-disconnect', { runtime: runtime });
  }

  subscribe(runtime: string, uuid: string, topic: string) {
    this.ipc.send('openfin-subscribe', { runtime: runtime, uuid: uuid, topic: topic });
  }

  unsubscribe(runtime: string, uuid: string, topic: string) {
    this.ipc.send('openfin-unsubscribe', { runtime: runtime, uuid: uuid, topic: topic });
  }

  // Receive Events
  connected(runtime: string, version: string) {
    this.observables.runtimes[runtime].next({ version: version });
  }

  /*receiveMessage(version: string): Observable<any> {
  }*/
}
