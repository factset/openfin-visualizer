import {
  Component,
  OnInit,
  AfterViewInit,
  Output,
  Input,
  EventEmitter,
  Inject,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
  NgZone,
  OnDestroy
} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';

import { Subscription } from 'rxjs';
import { ClipboardService } from 'ngx-clipboard';
import { OpenfinService } from '../openfin.service';
import { ElectronService } from 'ngx-electron';

export interface DialogData {
  data: any;
}

export interface ParticipantDialogData {
  info: any;
  messages: Array<any>;
  runtime: string;
}

@Component({
  selector: 'app-add-json-dialog',
  template: `
    <h1 mat-dialog-title>Add JSON</h1>
    <div mat-dialog-content>
      <json-editor
          [options]="editorOptions"
          [data]="data">
      </json-editor>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()" cdkFocusInitial>Cancel</button>
      <button mat-button (click)="onClick()" [disabled]="invalid">Ok</button>
      <button mat-button (click)="onCopy()" style="margin-left: auto;">Copy</button>
    </div>
  `,
  styleUrls: ['./viewer.component.css']
})
export class AddJsonDialogComponent {

  @ViewChild(JsonEditorComponent) editor: JsonEditorComponent;

  editorOptions: JsonEditorOptions;
  json: any;
  invalid = false;

  constructor(public dialogRef: MatDialogRef<AddJsonDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData,
              public _clipboardService: ClipboardService,
              public zone: NgZone) {
    this.editorOptions = new JsonEditorOptions();
    this.editorOptions.modes = ['code', 'tree', 'view'];
    this.invalid = !this.data;
    this.json = this.data;
    this.editorOptions.onChange = () => {
      this.zone.run(() => {
        try {
          this.json = this.editor.get();
          this.invalid = false;
        } catch {
          this.invalid = true;
        }
      });
    };
  }

  onClick(): void {
    this.dialogRef.close(this.json);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onCopy(): void {
    this._clipboardService.copyFromContent(JSON.stringify(this.json));
  }

}

@Component({
  selector: 'app-view-participant-dialog',
  template: `
    <div class="participant-dialog-header">
      <div
          class="participant-icon-container participant-dialog-icon-container"
          [ngStyle]="{ 'background': data.info.color }">
        <mat-icon class="participant-icon">desktop_windows</mat-icon>
      </div>
      <h1 mat-dialog-title style="margin: 0 0 0 10px">
        {{ data.info.name }}
      </h1>
    </div>

    <div mat-dialog-content>
      <div class="participant-dialog-info-list">
        <div class="participant-dialog-info-item">
          First met: {{ data.messages[0].datetime }}
        </div>
        <div class="participant-dialog-info-item">
          Last seen: {{ data.messages[data.messages.length-1].datetime }}
        </div>
      </div>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onClick()" cdkFocusInitial>Close</button>
      <button mat-button (click)="onMessage()" style="margin-left: auto;">Follow</button>
    </div>
  `,
  styleUrls: ['./viewer.component.css']
})
export class ViewParticipantDialogComponent {

  constructor(public dialogRef: MatDialogRef<ViewParticipantDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ParticipantDialogData) {
  }

  onClick(): void {
    this.dialogRef.close();
  }

  onMessage(): void {
    this.dialogRef.close({ uuid: this.data.info.uuid });
  }

}

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
})
export class ViewerComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() runtime: string;
  @Input() uuid: string;
  @Input() topic: string;
  @Input() selected: boolean;
  @ViewChild('viewerLog') viewerLog: ElementRef;
  @ViewChildren('messageItems') messageItems: QueryList<any>;

  @Output() received: EventEmitter<any> = new EventEmitter<any>();
  @Output() newTabCreated: EventEmitter<any> = new EventEmitter<any>();

  ipc: any;
  subscription: Subscription;
  unread = 0;
  message = '';
  dateOptions: any = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  selfUuid: string;
  messages: any = [];
  participants: any = {};
  colors: any = [
    '#E57373',
    '#BA68C8',
    '#9575CD',
    '#4FC3F7',
    '#4DD0E1',
    '#AED581',
    '#DCE775',
    '#FFD54F',
    '#F06292',
    '#7986CB',
    '#4DB6AC',
    '#FFF176',
    '#81C784'
  ];

  constructor(public openfin: OpenfinService,
              public dialog: MatDialog,
              public zone: NgZone,
              private _electronService: ElectronService) {
    this.ipc = _electronService.ipcRenderer;
  }

  ngOnInit() {
    this.subscribe();
  }

  ngAfterViewInit() {
    this.selfUuid  = `openfin-visualizer-${this.runtime}`;
    this.messageItems.changes.subscribe(t => {
      this.scrollToEnd();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  subscribe() {
    this.subscription = this.openfin.subscribe(this.runtime, this.uuid, this.topic).subscribe(data => {
      this.zone.run(() => {
        if (!this.participants.hasOwnProperty(data.sender.uuid)) {
          this.participants[data.sender.uuid] = {
            name: data.sender.name ? data.sender.name : data.sender.uuid,
            uuid: data.sender.uuid,
            color: data.sender.uuid === this.selfUuid
              ? '#2196F3' : this.colors.pop() // TODO* random color
          };
        }

        this.messages.push({
          participant: this.participants[data.sender.uuid].name,
          datetime: new Date().toLocaleString('en-US'), // TODO* get time from OF object
          content: data.message
        });

        if (!this.selected) {
          this.received.emit({
            runtime: this.runtime,
            topic: this.topic,
            unread: ++this.unread
          });
        }
      });
    });
  }

  send() {
    if (this.message && JSON.parse(this.message)) {
      if (this.uuid === '*') {
        this.openfin.publish(this.runtime, this.topic, JSON.parse(this.message));
      } else {
        this.openfin.send(this.runtime, this.uuid, this.topic, JSON.parse(this.message));

        // Spoof results since they will not be returned since you can't subscribe
        // to the other UUID and yourself explicitly
        if (!this.participants.hasOwnProperty(this.selfUuid)) {
          this.participants[this.selfUuid] = {
            name: this.selfUuid,
            uuid: this.selfUuid,
            color: '#2196F3'
          };
        }

        this.messages.push({
          participant: this.participants[this.selfUuid].name,
          datetime: new Date().toLocaleString('en-US'), // TODO* get time from OF object
          content: this.message
        });
      }

      this.message = '';
    }
  }

  getParticipantColor(participant: string): string {
    return this.participants[participant].color;
  }

  openJson(data: string) {
    const dialogRef = this.dialog.open(AddJsonDialogComponent, {
      width: '50%',
      restoreFocus: false,
      data: JSON.parse(data)
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.message = JSON.stringify(result);
      }
    });
  }

  addJson() {
    const dialogRef = this.dialog.open(AddJsonDialogComponent, {
      width: '50%',
      restoreFocus: false,
      data: this.message ? JSON.parse(this.message) : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.message = JSON.stringify(result);
      }
    });
  }

  viewParticipant(name: string) {
    const participant = {
      messages: this.messages.filter(m => m.participant === name),
      info: this.participants[name],
      runtime: this.runtime
    };

    const pDialogRef = this.dialog.open(ViewParticipantDialogComponent, {
      width: '500px',
      restoreFocus: false,
      data: participant
    });

    pDialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO* maybe check for a 'command' in result i.e. 'direct-message'
        // in case other information is returned
        const res = result;
        result.topic = this.topic;
        result.runtime = this.runtime;
        this.newTabCreated.emit(result);
      }
    });
  }

  scrollToEnd() {
    this.viewerLog.nativeElement.scrollTop = this.viewerLog.nativeElement.scrollHeight;
  }

  // On focus from different tab
  waitScrollToEnd() {
    setTimeout(() => {
      this.scrollToEnd();
    }, 0);

    if (!this.selected) {
      this.received.emit({
        runtime: this.runtime,
        topic: this.topic,
        unread: this.unread > 0 ? --this.unread : 0
      });
    }
  }

  onKey(event: any) {
    this.message = event.target.value;
  }

  saveLog() {
    this.ipc.send('save-log', {
      log: this.prepLog(this.messages),
      runtime: this.runtime,
      topic: this.topic,
      uuid: this.uuid
    });
  }

  prepLog(messages: any): string {
    const header = `runtime [${this.runtime}] | topic [${this.topic}] | uuid [${this.uuid}]`;
    let log = `${header}\r\n`;
    for (let i = 0; i < header.length; i++) {
      log += '=';
    }
    log += '\r\n\r\n';

    messages.forEach(message => {
      log += `${message.participant} <${message.datetime}>:\r\n`;
      log += `${this.prettifyJson(message.content, true)}\r\n\r\n`;
    });
    return log;
  }

  // TODO* move this to pipe
  prettifyJson(json: string, noHtml: boolean = false) {
    json = JSON.parse(json);
    json = JSON.stringify(json, undefined, 4);
    if (noHtml) {
      return json;
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
    return json.replace(regex, function (match) {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
            cls = 'key';
        } else {
            cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

}
