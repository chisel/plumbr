import { Component, OnInit } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';
import {
  faSearchPlus,
  faSearchMinus,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-scalebar',
  templateUrl: './scalebar.component.html',
  styleUrls: ['./scalebar.component.scss']
})
export class ScalebarComponent implements OnInit {

  public static SCALE_POWER: number = .1;

  public faSearchPlus = faSearchPlus;
  public faSearchMinus = faSearchMinus;
  public faSyncAlt = faSyncAlt;

  public currentScale: number;
  public overlaysEnabled: boolean = true;
  public expanded: boolean = false;

  constructor(
    private _canvas: CanvasService
  ) { }

  ngOnInit(): void {

    // Update currentScale
    this._canvas.currentScale$(newScale => this.currentScale = Math.round((newScale + (1 - CanvasService.SCALE_DEFAULT)) * 100));
    // Update overlaysEnabled
    this._canvas.overlaysEnabled$(enabled => this.overlaysEnabled = enabled);

  }

  public onScaleUp() {

    this._canvas.currentScale += ScalebarComponent.SCALE_POWER;

  }

  public onScaleDown() {

    this._canvas.currentScale -= ScalebarComponent.SCALE_POWER;

  }

  public onScaleReset() {

    this._canvas.currentScale = CanvasService.SCALE_DEFAULT;

  }

  public onMouseEnter() {

    this.expanded = true;

  }

  public onMouseLeave() {

    this.expanded = false;

  }

}
