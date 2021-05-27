import { Component, OnInit, Input } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';

@Component({
  selector: 'app-updatebar',
  templateUrl: './updatebar.component.html',
  styleUrls: ['./updatebar.component.scss']
})
export class UpdatebarComponent implements OnInit {

  @Input('version')
  public version: string;

  public overlaysEnabled: boolean = true;

  constructor(
    private _canvas: CanvasService
  ) { }

  ngOnInit(): void {

    // Update overlaysEnabled
    this._canvas.overlaysEnabled$(enabled => this.overlaysEnabled = enabled);

  }

  public onRefresh() {

    window.location.reload();

  }

}
