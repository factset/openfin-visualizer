import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  ipc: any;

  constructor(public snackBar: MatSnackBar,
              private _electronService: ElectronService) {
    this.ipc = _electronService.ipcRenderer;

    // Register IPC listeners
    this.registerListeners();
  }

  registerListeners(): void {

    this.ipc.on('error', (event, data) => {
      this.snackBar.open(data.body, 'Dismiss', {
        duration: 3000
      });
    });

    this.ipc.on('info', (event, data) => {
      this.snackBar.open(data.body, 'Dismiss', {
        duration: 3000
      });
    });

  }

}
