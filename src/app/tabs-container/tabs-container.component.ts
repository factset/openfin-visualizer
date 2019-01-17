import {
  Component,
  OnInit,
  Inject,
  Output,
  Input,
  EventEmitter,
  ViewChildren,
  ElementRef,
  QueryList
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material';
import { FormControl, Validators } from '@angular/forms';

import { Subscription } from 'rxjs';
import { OpenfinService } from '../openfin.service';

export interface DialogData {
  runtime: string;
}

@Component({
  selector: 'app-tabs-container',
  templateUrl: './tabs-container.component.html',
  styleUrls: ['./tabs-container.component.css']
})
export class TabsContainerComponent implements OnInit {

  @Input() chosenRuntime: string;
  @ViewChildren('appViewer') appViewers: QueryList<any>;

  @Output() onModify: EventEmitter<any> = new EventEmitter<any>();

  tabs: any = [];
  selected = new FormControl(0);

  runtime: string;

  constructor(public dialog: MatDialog,
              public openfin: OpenfinService) { }

  ngOnInit() { }

  addTab() {
    const dialogRef = this.dialog.open(AddTabDialogComponent, {
      width: '250px',
      restoreFocus: false,
      data: this.chosenRuntime
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let index = this.tabs.findIndex(t => {
          return t.runtime === this.chosenRuntime
            && t.uuid === result.uuid
            && t.topic === result.topic;
        });

        if (index < 0) {
          this.tabs.push({
            label: result.topic,
            runtime: this.chosenRuntime,
            uuid: result.uuid,
            topic: result.topic,
            unread: 0
          });
          this.selected.setValue(this.tabs.length - 1);
          this.onModify.emit({ tabs: this.tabs });
        } else {
          this.selected.setValue(index);
        }
      }
    });
  }

  removeTab(event, index: number) {
    event.stopPropagation();
    let tab = this.tabs.splice(index, 1)[0];
    this.openfin.unsubscribe(tab.runtime, tab.uuid, tab.topic);
    this.onModify.emit({ tabs: this.tabs });
    // Maybe add a re-render here in case of overflow and pagination
  }

  changeSelected(index) {
    let viewers = this.appViewers.toArray();
    if (viewers.length > 0) {
      this.selected.setValue(index);
      viewers[index].waitScrollToEnd();
    }
  }

  setUnread(data) {
    let tab = this.tabs.find(t => {
      return t.topic === data.topic && t.runtime === data.runtime;
    });
    tab.unread = data.unread;
  }

  newTab(data) {
    let index = this.tabs.findIndex(t => {
      return t.uuid === data.uuid && t.topic === data.topic;
    });

    if (index < 0) {
      this.tabs.push({
        label: data.topic,
        runtime: data.runtime,
        uuid: data.uuid,
        topic: data.topic,
        unread: 0
      });

      this.selected.setValue(this.tabs.length - 1);
      this.onModify.emit({ tabs: this.tabs });
    } else {
      this.changeSelected(index);
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
        <input matInput placeholder="Channel" [value]="data" disabled />
      </mat-form-field>
      <mat-form-field style="margin-bottom: 15px;">
        <input matInput placeholder="UUID" [(ngModel)]="uuid" cdkFocusInitial />
        <mat-hint>Leave blank for all</mat-hint>
      </mat-form-field>
      <mat-form-field>
        <input matInput placeholder="Topic" [(ngModel)]="topic" [formControl]="topicFormControl" />
        <mat-error *ngIf="topicFormControl.hasError('required')">
          Topic is <strong>required</strong>
        </mat-error>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()">Cancel</button>
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

  constructor(public dialogRef: MatDialogRef<AddTabDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

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
