import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  version: string;
  options: any;
}

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.css']
})
export class DrawerComponent implements OnInit {

  opened: boolean;
  versions: any = [
    { name: 'Stable', options: {} }
  ];
  version: string;
  activeVersion: string;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  addVersion() {
    const dialogRef = this.dialog.open(AddVersionDialogComponent, {
      width: '250px',
      data: { topic: this.version }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.versions.push({ name: result, options: {} });
        this.activeVersion = result;
      }
    });
  }

  removeVersion(event, index: number) {
    event.stopPropagation();
    this.versions.splice(index, 1);
  }

  setActive(version: string) {
    this.activeVersion = version;
  }

}

@Component({
  selector: 'app-add-version-dialog',
  template: `
    <h1 mat-dialog-title>Connect to OpenFin</h1>
    <div mat-dialog-content>
      <p>Enter a version</p>
      <mat-form-field>
        <input matInput [(ngModel)]="data.version">
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()">No Thanks</button>
      <button mat-button [mat-dialog-close]="data.version" cdkFocusInitial>Ok</button>
    </div>
  `,
  styleUrls: ['./drawer.component.css']
})
export class AddVersionDialogComponent {

  constructor(public dialogRef: MatDialogRef<AddVersionDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
