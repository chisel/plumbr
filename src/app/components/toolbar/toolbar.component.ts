import { Component, OnInit, Renderer2 } from '@angular/core';
import {
  faMousePointer,
  faPlus,
  faArrowsAlt,
  faLink,
  faEraser,
  faFileDownload,
  faFileUpload,
  faQuestion,
  faCrosshairs
} from '@fortawesome/free-solid-svg-icons';
import { CanvasService } from '@plumbr/service/canvas';
import { ToolbarService, Tools } from '@plumbr/service/toolbar';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  // Icons
  public faMousePointer = faMousePointer;
  public faPlus = faPlus;
  public faArrowsAlt = faArrowsAlt;
  public faLink = faLink;
  public faEraser = faEraser;
  public faFileDownload = faFileDownload;
  public faFileUpload = faFileUpload;
  public faQuestion = faQuestion;
  public faCrosshairs = faCrosshairs;

  public toolbarEnabled: boolean;
  public selectedTool: Tools;
  public Tools = Tools;

  constructor(
    private _canvas: CanvasService,
    private _toolbar: ToolbarService,
    private _renderer: Renderer2
  ) { }

  ngOnInit(): void {

    this._canvas.overlaysEnabled$(enabled => this.toolbarEnabled = enabled);
    this._toolbar.selectedTool$(selected => this.selectedTool = selected);

    // Register global event handlers for shortcuts
    this._renderer.listen('window', 'keyup.p', () => { this._toolbar.selectedTool = Tools.Pointer; });
    this._renderer.listen('window', 'keyup.i', () => { this._toolbar.selectedTool = Tools.Insert; });
    this._renderer.listen('window', 'keyup.m', () => { this._toolbar.selectedTool = Tools.Move; });
    this._renderer.listen('window', 'keyup.l', () => { this._toolbar.selectedTool = Tools.Link; });
    this._renderer.listen('window', 'keyup.e', () => { this._toolbar.selectedTool = Tools.Erase; });
    this._renderer.listen('window', 'keyup.shift.r', () => { this._canvas.resetCanvasPosition(); });

  }

  public onMouseEnter(tooltip: HTMLElement) {

    tooltip.classList.add('expanded');

  }

  public onMouseLeave(tooltip: HTMLElement) {

    tooltip.classList.remove('expanded');

  }

  public onSelectTool(tool: Tools) {

    this._toolbar.selectedTool = tool;

  }

  public onResetCanvasPosition() {

    this._canvas.resetCanvasPosition();

  }

}
