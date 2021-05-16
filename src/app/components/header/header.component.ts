import { Component, OnInit } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public canvasMoveMode: boolean;
  public canvasMoving: boolean;
  public headerEnabled: boolean;

  constructor(
    private _canvas: CanvasService
  ) { }

  ngOnInit(): void {

    this._canvas.canvasMoveMode$(enabled => this.canvasMoveMode = enabled);
    this._canvas.canvasMoving$(enabled => this.canvasMoving = enabled);
    this._canvas.headerEnabled$(enabled => this.headerEnabled = enabled);

  }

}
