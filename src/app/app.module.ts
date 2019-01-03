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
  MatInputModule
} from '@angular/material';

import { AppComponent } from './app.component';
import { DrawerComponent } from './drawer/drawer.component';
import { TabsContainerComponent, AddTabDialogComponent } from './tabs-container/tabs-container.component';

@NgModule({
  declarations: [
    AppComponent,
    DrawerComponent,
    TabsContainerComponent,
    AddTabDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NoopAnimationsModule, // disable animations for now
    FormsModule,
    MatSidenavModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule
  ],
  entryComponents: [AddTabDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
