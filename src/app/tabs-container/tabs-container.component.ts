import {
  Component,
  OnInit,
  Inject,
  Input,
  ViewChildren,
  ElementRef,
  QueryList
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatSnackBar
} from '@angular/material';
import { FormControl, Validators } from '@angular/forms';

import { Subscription } from 'rxjs';
import { OpenfinService } from '../openfin.service';

@Component({
  selector: 'app-tabs-container',
  templateUrl: './tabs-container.component.html',
  styleUrls: ['./tabs-container.component.css']
})
export class TabsContainerComponent implements OnInit {

  @Input() chosenRuntime: string;
  @ViewChildren('appViewer') appViewers: QueryList<any>;

  tabs: any = [
    //{ label: 'Test', runtime: 'stable', uuid: '*', topic: 'symbol-topic' }
  ];
  selected = new FormControl(0);

  uuid: string;
  topic: string;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  addTab() {
    const dialogRef = this.dialog.open(AddTabDialogComponent, {
      width: '250px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tabs.push({
          label: result.topic,
          runtime: this.chosenRuntime,
          uuid: result.uuid,
          topic: result.topic
        });

        this.selected.setValue(this.tabs.length - 1);
      }
    });
  }

  removeTab(event, index: number) {
    event.stopPropagation();
    this.tabs.splice(index, 1);
  }

  changeSelected(event) {
    if (this.appViewers) {
      this.selected.setValue(event);
      this.appViewers.toArray()[event].waitScrollToEnd();
    }
  }

}

@Component({
  selector: 'app-add-tab-dialog',
  template: `
    <h1 mat-dialog-title>Add Topic</h1>
    <div mat-dialog-content>
      <p>Enter a UUID and topic</p>
      <mat-form-field style="margin-bottom: 15px;">
        <input matInput placeholder="Enter UUID" [(ngModel)]="uuid" />
        <mat-hint>Leave blank for all</mat-hint>
      </mat-form-field>
      <mat-form-field>
        <input matInput placeholder="Enter topic" [(ngModel)]="topic" [formControl]="topicFormControl" />
        <mat-error *ngIf="topicFormControl.hasError('required')">
          Topic is <strong>required</strong>
        </mat-error>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()" cdkFocusInitial>Cancel</button>
      <button mat-button (click)="onClick()" [disabled]="topicFormControl.hasError('required')">Ok</button>
    </div>
  `,
  styleUrls: ['./tabs-container.component.css']
})
export class AddTabDialogComponent {

  uuid: string = '';
  topic: string = '';
  topicFormControl = new FormControl('', [
    Validators.required
  ]);

  constructor(public dialogRef: MatDialogRef<AddTabDialogComponent>) {
  }

  onClick(): void {
    this.dialogRef.close({
      uuid: this.uuid ? this.uuid : '*',
      topic: this.topic
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
