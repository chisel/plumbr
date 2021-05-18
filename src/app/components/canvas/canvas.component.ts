import { Component, OnInit, HostListener } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';
import { ToolbarService, Tools } from '@plumbr/service/toolbar';
import { StateService, PipelineData } from '@plumbr/service/state';
import { ModalService } from '@plumbr/service/modal';

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

      this._state.newPipeline(
        'test',
        Math.floor(left / 15) * 15,
        Math.floor(top / 15) * 15
      );

    }

  }

}
