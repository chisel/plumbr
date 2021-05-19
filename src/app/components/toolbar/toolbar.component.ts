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
  faCrosshairs,
  faUndoAlt
} from '@fortawesome/free-solid-svg-icons';
import { CanvasService } from '@plumbr/service/canvas';
import { ToolbarService, Tools } from '@plumbr/service/toolbar';
import { ModalService, ModalType } from '@plumbr/service/modal';
import { StateService } from '@plumbr/service/state';

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
  public faUndoAlt = faUndoAlt;

  public toolbarEnabled: boolean;
  public selectedTool: Tools;
  public Tools = Tools;

  constructor(
    private _canvas: CanvasService,
    private _toolbar: ToolbarService,
    private _modal: ModalService,
    private _state: StateService,
    private _renderer: Renderer2
  ) { }

  ngOnInit(): void {

    this._canvas.overlaysEnabled$(enabled => this.toolbarEnabled = enabled);
    this._toolbar.selectedTool$(selected => this.selectedTool = selected);

    // Register global event handlers for shortcuts
    this._renderer.listen('window', 'keyup.p', () => { this.onSelectTool(Tools.Pointer); });
    this._renderer.listen('window', 'keyup.i', () => { this.onSelectTool(Tools.Insert); });
    this._renderer.listen('window', 'keyup.m', () => { this.onSelectTool(Tools.Move); });
    this._renderer.listen('window', 'keyup.l', () => { this.onSelectTool(Tools.Link); });
    this._renderer.listen('window', 'keyup.e', () => { this.onSelectTool(Tools.Erase); });
    this._renderer.listen('window', 'keyup.shift.r', () => { this.onResetCanvasPosition(); });
    this._renderer.listen('window', 'keyup.h', () => { this.onHelp(); });
    this._renderer.listen('window', 'keyup.shift.z', () => { this.onUndo(); });
    this._renderer.listen('window', 'keyup.shift.i', () => { this.onImport(); });
    this._renderer.listen('window', 'keyup.shift.e', () => { this.onExport(); });

  }

  public onMouseEnter(tooltip: HTMLElement) {

    tooltip.classList.add('expanded');

  }

  public onMouseLeave(tooltip: HTMLElement) {

    tooltip.classList.remove('expanded');

  }

  public onSelectTool(tool: Tools) {

    if ( this._modal.currentModal !== null ) return;

    this._toolbar.selectedTool = tool;

  }

  public onResetCanvasPosition() {

    if ( this._modal.currentModal !== null ) return;

    this._canvas.resetCanvasPosition();

  }

  public onHelp() {

    if ( this._modal.currentModal !== null ) return;

    this._modal.openModal(ModalType.Help)
    .catch(console.error);

  }

  public onUndo() {

    if ( this._modal.currentModal !== null ) return;

    this._state.undo();

  }

  public onImport() {

    if ( this._modal.currentModal !== null ) return;

    this._state.import();

  }

  public onExport() {

    if ( this._modal.currentModal !== null ) return;

    this._state.export();

  }

}
