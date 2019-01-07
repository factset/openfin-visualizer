import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

import { AppComponent } from './app.component';
import { DrawerComponent, AddVersionDialogComponent } from './drawer/drawer.component';
import { TabsContainerComponent, AddTabDialogComponent } from './tabs-container/tabs-container.component';
import { ViewerComponent, AddJsonDialogComponent } from './viewer/viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    DrawerComponent,
    TabsContainerComponent,
    AddTabDialogComponent,
    AddVersionDialogComponent,
    ViewerComponent,
    AddJsonDialogComponent
  ],
  imports: [
    BrowserModule,
    NgJsonEditorModule,
    NgxElectronModule,
    BrowserAnimationsModule,
    NoopAnimationsModule, // disable animations for now
    FormsModule,
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
    AddJsonDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
