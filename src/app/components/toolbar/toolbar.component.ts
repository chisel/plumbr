import { Component, OnInit } from '@angular/core';
import {
  faPlus,
  faArrowsAlt,
  faLink,
  faEraser,
  faFileDownload,
  faFileUpload,
  faQuestion
} from '@fortawesome/free-solid-svg-icons';
import { CanvasService } from '@plumbr/service/canvas';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  // Icons
  public faPlus = faPlus;
  public faArrowsAlt = faArrowsAlt;
  public faLink = faLink;
  public faEraser = faEraser;
  public faFileDownload = faFileDownload;
  public faFileUpload = faFileUpload;
  public faQuestion = faQuestion;

  public toolbarEnabled: boolean;

  constructor(
    private _canvas: CanvasService
  ) { }

  ngOnInit(): void {

    this._canvas.overlaysEnabled$(enabled => this.toolbarEnabled = enabled);

  }

  public onMouseEnter(tooltip: HTMLElement) {

    tooltip.classList.add('expanded');

  }

  public onMouseLeave(tooltip: HTMLElement) {

    tooltip.classList.remove('expanded');

  }

}
