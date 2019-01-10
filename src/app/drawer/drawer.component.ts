import {
  Component,
  OnInit,
  Inject,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBar,
  MatSidenav
} from '@angular/material';

import { Subscription } from 'rxjs';
import { OpenfinService } from '../openfin.service';

export interface DialogData {
  channels: Array<any>;
}

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.css']
})
export class DrawerComponent implements OnInit {

  @ViewChild('sidenav') sidenav: MatSidenav;

  opened: boolean = true;
  channels: Array<any> = [];
  version: string;
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
      width: '250px',
      data: { channels: this.channels }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.channels.push({ runtime: result.runtime, options: {} });

        let connection = this.openfin.connect(result.runtime).subscribe(version => {
          let channel = this.channels.find(c => c.runtime === result.runtime);
          channel.version = version.version;
          this.activeChannel = result.runtime;
          this.cd.detectChanges(); // force update to page
        });
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
    this.openfin.disconnectAll();
    this.channels = [];
  }

  setActive(runtime: string) {
    if (this.channels.find(c => c.runtime === runtime).hasOwnProperty('version')) {
      this.activeChannel = runtime;
    }
  }

  tabsModified(data) {
    if (!this.sidenav.opened && data.tabs.length === 0) {
      this.sidenav.open();
    } else if (this.sidenav.opened && data.tabs.length >= 0) {
      this.sidenav.close();
    }
  }

}

@Component({
  selector: 'app-add-version-dialog',
  template: `
    <h1 mat-dialog-title>Connect to OpenFin</h1>
    <div mat-dialog-content>
      <mat-form-field>
        <mat-select placeholder="Channel" [(value)]="selected">
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
    this.runtimes = this.runtimes.filter(runtime => {
      return !data.channels.find(channel => {
        return channel.runtime === runtime;
      });
    });

    this.selected = this.runtimes[0]; // auto-select first runtime
  }

  onClick(): void {
    this.dialogRef.close({ runtime: this.selected, options: {} });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
