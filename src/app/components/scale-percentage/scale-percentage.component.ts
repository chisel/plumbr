import { Component, OnInit } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';

@Component({
  selector: 'app-scale-percentage',
  templateUrl: './scale-percentage.component.html',
  styleUrls: ['./scale-percentage.component.scss']
})
export class ScalePercentageComponent implements OnInit {

  public currentScale: number = 1;
  public overlaysEnabled: boolean = true;

  constructor(
    private _canvas: CanvasService
  ) { }

  ngOnInit(): void {

    // Update currentScale
    this._canvas.currentScale$(newScale => this.currentScale = Math.round(newScale * 100));
    // Update overlaysEnabled
    this._canvas.overlaysEnabled$(enabled => this.overlaysEnabled = enabled);

  }

  public onResetScale() {

    this._canvas.currentScale = 1;

  }

}
