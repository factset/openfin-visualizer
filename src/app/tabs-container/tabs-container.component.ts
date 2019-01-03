import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl } from '@angular/forms';

export interface DialogData {
  topic: string;
}

@Component({
  selector: 'app-tabs-container',
  templateUrl: './tabs-container.component.html',
  styleUrls: ['./tabs-container.component.css']
})
export class TabsContainerComponent implements OnInit {

  tabs: any = [
    { label: 'Test', topic: 'Some topic' }
  ];
  selected = new FormControl(0);

  topic: string;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  addTab() {
    const dialogRef = this.dialog.open(AddTabDialogComponent, {
      width: '250px',
      data: { topic: this.topic }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tabs.push({ label: result, topic: result });
        this.selected.setValue(this.tabs.length - 1);
      }
    });
  }

  removeTab(event, index: number) {
    event.stopPropagation();
    this.tabs.splice(index, 1);
  }

}

@Component({
  selector: 'app-add-tab-dialog',
  template: `
    <h1 mat-dialog-title>Add Topic</h1>
    <div mat-dialog-content>
      <p>Enter a topic</p>
      <mat-form-field>
        <input matInput [(ngModel)]="data.topic">
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()">No Thanks</button>
      <button mat-button [mat-dialog-close]="data.topic" cdkFocusInitial>Ok</button>
    </div>
  `,
  styleUrls: ['./tabs-container.component.css']
})
export class AddTabDialogComponent {

  constructor(public dialogRef: MatDialogRef<AddTabDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
