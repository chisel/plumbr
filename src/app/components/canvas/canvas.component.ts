import { Component, OnInit, HostListener } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';
import { ToolbarService, Tools } from '@plumbr/service/toolbar';
import { StateService, PipelineData, ModuleData, ModuleFieldData } from '@plumbr/service/state';
import { ModalService, ModalType } from '@plumbr/service/modal';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit {

  public canvasEnabled: boolean;
  public canvasMoveMode: boolean;
  public canvasMoving: boolean = false;
  public canvasLeft: number = 0;
  public canvasTop: number = 0;
  public canvasWidthAddition: number = 0;
  public canvasHeightAddition: number = 0;
  public selectedTool: Tools;
  public Tools = Tools;
  public data: PipelineData[] = [];
  public moduleHovered: boolean = false;
  public moduleFieldHovered: boolean = false;
  public pipelineStackMoving: boolean = false;
  public moduleStackMoving: boolean = false;

  @HostListener('document:keydown.space', ['$event'])
  onMoveModeEnable() {

    this._canvas.canvasMoveMode = true;

  }

  @HostListener('document:keyup.space', ['$event'])
  onMoveModeDisable() {

    this._canvas.canvasMoveMode = false;

  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {

    if ( ! this.canvasMoveMode ) return;

    // Ignore if left click button is not held
    if ( event.buttons !== 1 ) {

      this._canvas.canvasMoving = false;
      return;

    }

    this._canvas.canvasMoving = true;
    event.preventDefault();

    // Move the canvas
    this.canvasLeft = Math.min(this.canvasLeft + event.movementX, 0);
    this.canvasTop = Math.min(this.canvasTop + event.movementY, 0);

    // Extend the canvas to cover the empty spaces
    this.canvasWidthAddition = Math.abs(this.canvasLeft);
    this.canvasHeightAddition = Math.abs(this.canvasTop);

  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {

    if ( ! this.canvasMoveMode || event.buttons !== 1 ) return;

    this._canvas.canvasMoving = true;
    event.preventDefault();

  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {

    if ( ! this.canvasMoveMode || event.buttons !== 0 ) return;

    this._canvas.canvasMoving = false;
    event.preventDefault();

  }

  constructor(
    private _canvas: CanvasService,
    private _toolbar: ToolbarService,
    private _state: StateService,
    private _modal: ModalService
  ) { }

  ngOnInit(): void {

    // Update canvas status
    this._canvas.canvasEnabled$(enabled => this.canvasEnabled = enabled);

    // Update canvas move mode
    this._canvas.canvasMoveMode$(enabled => this.canvasMoveMode = enabled);

    // Update canvas moving mode
    this._canvas.canvasMoving$(enabled => this.canvasMoving = enabled);

    // Update selected tool
    this._toolbar.selectedTool$(selected => this.selectedTool = selected);

    // Update data
    this._state.data$(data => this.data = data);

    // Listen to modal events to toggle canvas state
    this._modal.onModalOpen$(() => this._canvas.canvasEnabled = false);
    this._modal.onModalClosed$(() => this._canvas.canvasEnabled = true);

    // Register event handler for canvas position reset
    this._canvas.onCanvasReset$(() => {

      this.canvasTop = 0;
      this.canvasLeft = 0;
      this.canvasWidthAddition = 0;
      this.canvasHeightAddition = 0;
      this.canvasMoveMode = false;
      this.canvasMoving = false;

    });

  }

  public onElementMovementStart() {

    this._canvas.canvasEnabled = false;
    this._canvas.overlaysEnabled = false;

  }

  public onElementMovementEnd(element: HTMLElement, index: number) {

    this._canvas.canvasEnabled = true;
    this._canvas.overlaysEnabled = true;

    // Update pipeline position
    this._state.updatePipelinePosition(
      index,
      +element.style.left.substr(0, element.style.left.length - 2),
      +element.style.top.substr(0, element.style.top.length - 2)
    );

  }

  public onCanvasClick(event: MouseEvent) {

    if ( ! this.canvasEnabled || this.canvasMoveMode ) return;

    // Insert a new pipeline
    if ( this.selectedTool === Tools.Insert ) {

      const left = event.clientX + Math.abs(this.canvasLeft) - 345;
      const top = event.clientY + Math.abs(this.canvasTop);

      this._modal.openModal(ModalType.NewPipeline)
      .then(data => {

        if ( ! data ) return;

        this._state.newPipeline(
          data.name,
          Math.floor(left / 15) * 15,
          Math.floor(top / 15) * 15,
          data.description
        );

      })
      .catch(console.error);

    }

  }

  public onPipelineClick(event: MouseEvent, index: number) {

    if ( this.canvasMoveMode ) return;

    if ( this._toolbar.selectedTool === Tools.Insert ) {

      event.stopImmediatePropagation();

      this._modal.openModal(ModalType.NewModule)
      .then((data: ModuleData) => {

        if ( ! data ) return;

        this._state.newModule(index, data.name, data.type, data.description);

      })
      .catch(console.error);

    }
    else if ( this._toolbar.selectedTool === Tools.Erase ) {

      event.stopImmediatePropagation();

      this._state.deletePipeline(index);
      this.moduleHovered = false;
      this.moduleFieldHovered = false;

    }

  }

  public onModuleClick(event: MouseEvent, index: number, mindex: number) {

    if ( this.canvasMoveMode ) return;

    if ( this._toolbar.selectedTool === Tools.Insert ) {

      event.stopImmediatePropagation();

      this._modal.openModal(ModalType.NewModuleField)
      .then((data: ModuleFieldData) => {

        if ( ! data ) return;

        this._state.newField(
          index,
          mindex,
          data.operation,
          data.target,
          data.type,
          data.conditional,
          data.description
        );

      })
      .catch(console.error);

    }
    else if ( this._toolbar.selectedTool === Tools.Erase ) {

      event.stopImmediatePropagation();

      this._state.deleteModule(index, mindex);
      this.moduleHovered = false;
      this.moduleFieldHovered = false;

    }

  }

  public onModuleFieldClick(event: MouseEvent, index: number, mindex: number, findex: number) {

    if ( this.canvasMoveMode ) return;

    if ( this._toolbar.selectedTool !== Tools.Erase ) return;

    event.stopImmediatePropagation();

    this._state.deleteModuleField(index, mindex, findex);
    this.moduleHovered = false;
    this.moduleFieldHovered = false;

  }

  public onModuleMouseHover() {

    this.moduleHovered = true;

  }

  public onModuleMouseLeave() {

    this.moduleHovered = false;

  }

  public onModuleFieldMouseHover() {

    this.moduleFieldHovered = true;

  }

  public onModuleFieldMouseLeave() {

    this.moduleFieldHovered = false;

  }

  public onPipelineStackMoveStart() {

    this.pipelineStackMoving = true;

  }

  public onPipelineStackMoveEnd() {

    this.pipelineStackMoving = false;

  }

  public onModuleStackMoveStart() {

    this.moduleStackMoving = true;

  }

  public onModuleStackMoveEnd() {

    this.moduleStackMoving = false;

  }

}
