import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  MatSidenavModule,
  MatTabsModule,
  MatButtonModule,
  MatIconModule,
  MatDialogModule,
  MatInputModule,
  MatListModule,
  MatCardModule,
  MatDividerModule,
  MatTooltipModule,
  MatSelectModule,
  MatSnackBarModule
} from '@angular/material';

import { NgJsonEditorModule } from 'ang-jsoneditor';
import { NgxElectronModule } from 'ngx-electron';
import { ClipboardModule } from 'ngx-clipboard';

import { AppComponent } from './app.component';
import { DrawerComponent, AddVersionDialogComponent } from './drawer/drawer.component';
import { TabsContainerComponent, AddTabDialogComponent } from './tabs-container/tabs-container.component';
import { ViewerComponent, AddJsonDialogComponent, ViewParticipantDialogComponent } from './viewer/viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    DrawerComponent,
    TabsContainerComponent,
    AddTabDialogComponent,
    AddVersionDialogComponent,
    ViewerComponent,
    AddJsonDialogComponent,
    ViewParticipantDialogComponent
  ],
  imports: [
    BrowserModule,
    NgJsonEditorModule,
    NgxElectronModule,
    ClipboardModule,
    BrowserAnimationsModule,
    NoopAnimationsModule, // disable animations for now
    FormsModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatListModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  entryComponents: [
    AddTabDialogComponent,
    AddVersionDialogComponent,
    AddJsonDialogComponent,
    ViewParticipantDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
