import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

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
import { ScalePercentageComponent } from './components/scale-percentage/scale-percentage.component';

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
    ScalePercentageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    FontAwesomeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
