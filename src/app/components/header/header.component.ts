import { Component, OnInit } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public headerEnabled: boolean;

  constructor(
    private _canvas: CanvasService
  ) { }

  ngOnInit(): void {

    this._canvas.overlaysEnabled$(enabled => this.headerEnabled = enabled);

  }

}
