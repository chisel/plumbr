import { Component, OnInit, HostListener } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';

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
    private _canvas: CanvasService
  ) { }

  ngOnInit(): void {

    // Update canvas status
    this._canvas.canvasEnabled$(enabled => this.canvasEnabled = enabled);

    // Update canvas move mode
    this._canvas.canvasMoveMode$(enabled => this.canvasMoveMode = enabled);

    // Update canvas moving mode
    this._canvas.canvasMoving$(enabled => this.canvasMoving = enabled);

  }

  public onElementMovementStart() {

    this._canvas.canvasEnabled = false;
    this._canvas.overlaysEnabled = false;

  }

  public onElementMovementEnd() {

    this._canvas.canvasEnabled = true;
    this._canvas.overlaysEnabled = true;

  }

}
