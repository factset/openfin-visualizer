import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBar
} from '@angular/material';

import { Subscription } from 'rxjs';
import { OpenfinService } from '../openfin.service';

export interface DialogData {
  runtime: string;
  options: any;
}

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.css']
})
export class DrawerComponent implements OnInit {

  opened: boolean = true;
  channels: any = [];
  version: string;
  runtime: string;
  options: any = {};
  activeChannel: string;
  timeout: any;

  constructor(public dialog: MatDialog,
              public openfin: OpenfinService,
              public snackbar: MatSnackBar,
              public cd: ChangeDetectorRef) { }

  ngOnInit() {
  }

  addChannel() {
    const dialogRef = this.dialog.open(AddVersionDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.channels.push({ runtime: result.runtime, options: {} });

        let connection = this.openfin.connect(result.runtime).subscribe(version => {
          clearTimeout(this.timeout);
          let channel = this.channels.find(c => c.runtime === result.runtime);
          channel.version = version;
          this.activeChannel = result.runtime;
          this.cd.detectChanges(); // force update to page
        });

        // Timeout after 5 seconds of not connecting
        this.timeout = setTimeout(() => {
          this.channels.pop(); // remove faulty channel
          connection.unsubscribe();
          this.snackbar.open(`Could not connect to channel: ${result.runtime}`, 'Dismiss', {
            duration: 5000
          });
        }, 5000);
      }
    });
  }

  removeChannel(event, index: number) {
    event.stopPropagation();
    let channel = this.channels.splice(index, 1)[0];
    this.openfin.disconnect(channel.runtime);
    this.activeChannel = this.channels.length > 0 ? this.channels[length - 1] : null;
  }

  removeAllChannels() {
    event.stopPropagation();
    this.channels.forEach(channel => {
      this.openfin.disconnect(channel.runtime);
    });
    this.channels = [];
  }

  setActive(runtime: string) {
    if (this.channels.find(c => c.runtime === runtime).hasOwnProperty('version')) {
      this.activeChannel = runtime;
    }
  }

}

@Component({
  selector: 'app-add-version-dialog',
  template: `
    <h1 mat-dialog-title>Connect to OpenFin</h1>
    <div mat-dialog-content>
      <mat-form-field>
        <mat-select placeholder="Select channel" [(value)]="selected">
          <mat-option *ngFor="let runtime of runtimes" [value]="runtime">
            {{ runtime }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()" cdkFocusInitial>Cancel</button>
      <button mat-button (click)="onClick()">Ok</button>
    </div>
  `,
  styleUrls: ['./drawer.component.css']
})
export class AddVersionDialogComponent {

  runtimes: any = [
    'stable',
    'community',
    'beta',
    'alpha',
    'canary',
    'canary-next',
    'stable-v8',
    'stable-v7',
    'stable-v6'
  ];
  selected: string;

  constructor(public dialogRef: MatDialogRef<AddVersionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  onClick(): void {
    this.dialogRef.close({ runtime: this.selected, options: {} });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
