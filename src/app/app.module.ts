import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { PipelineComponent } from './components/pipeline/pipeline.component';
import { ModuleComponent } from './components/module/module.component';
import { ModalComponent } from './components/modal/modal.component';
import { MovableDirective } from './directives/movable.directive';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ModuleFieldComponent } from './components/module-field/module-field.component';
import { StackableDirective } from './directives/stackable.directive';
import { ScalebarComponent } from './components/scalebar/scalebar.component';
import { LinkComponent } from './components/link/link.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    CanvasComponent,
    PipelineComponent,
    ModuleComponent,
    ModalComponent,
    MovableDirective,
    ToolbarComponent,
    ModuleFieldComponent,
    StackableDirective,
    ScalebarComponent,
    LinkComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    FontAwesomeModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
