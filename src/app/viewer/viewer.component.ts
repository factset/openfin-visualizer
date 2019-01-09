import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Inject,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
  NgZone
} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';

import { Subscription } from 'rxjs';
import { ClipboardService } from 'ngx-clipboard';
import { OpenfinService } from '../openfin.service';

export interface DialogData {
  data: any;
}

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
})
export class ViewerComponent implements OnInit {

  @Input() runtime: string;
  @Input() uuid: string;
  @Input() topic: string;
  @ViewChild('viewerLog') viewerLog: ElementRef;
  @ViewChildren('messageItems') messageItems: QueryList<any>;

  data: any;
  message: string = '';
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
              public zone: NgZone) {
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

  subscribe() {
    this.openfin.subscribe(this.runtime, this.uuid, this.topic).subscribe(data => {
      this.zone.run(() => {
        console.log(data.sender.uuid + ' : ' + data.message); // sender -> uuid, name
        // add to message items
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
      });
    });
  }

  send() {
    if (this.message && JSON.parse(this.message)) {
      if (this.uuid === '*') {
        this.openfin.publish(this.runtime, this.topic, JSON.parse(this.message));
      } else {
        this.openfin.send(this.runtime, this.uuid, this.topic, JSON.parse(this.message));
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
      data: this.message ? JSON.parse(this.message) : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.message = JSON.stringify(result);
      }
    });
  }

  scrollToEnd() {
    this.viewerLog.nativeElement.scrollTop = this.viewerLog.nativeElement.scrollHeight;
  }

  waitScrollToEnd() {
    setTimeout(() => {
      this.scrollToEnd();
    }, 0);
  }

  onKey(event: any) {
    this.message = event.target.value;
  }

  // TODO* move this to pipe
  prettifyJson(json: string) {
    json = JSON.parse(json);
    json = JSON.stringify(json, undefined, 4);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
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
  invalid: boolean = false;

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
    }
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
