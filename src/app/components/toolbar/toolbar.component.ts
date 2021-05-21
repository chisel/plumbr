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
  faFileImage,
  faPencilAlt
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
  public faFileImage = faFileImage;
  public faQuestion = faQuestion;
  public faPencilAlt = faPencilAlt;

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
    this._renderer.listen('window', 'keyup.s', () => { this.onSelectTool(Tools.Select); });
    this._renderer.listen('window', 'keyup.i', () => { this.onSelectTool(Tools.Insert); });
    this._renderer.listen('window', 'keyup.t', () => { this.onSelectTool(Tools.Edit); });
    this._renderer.listen('window', 'keyup.m', () => { this.onSelectTool(Tools.Move); });
    this._renderer.listen('window', 'keyup.l', () => { this.onSelectTool(Tools.Link); });
    this._renderer.listen('window', 'keyup.e', () => { this.onSelectTool(Tools.Erase); });
    this._renderer.listen('window', 'keyup.shift.r', () => { this.onResetCanvasPosition(); });
    this._renderer.listen('window', 'keyup.h', () => { this.onHelp(); });
    this._renderer.listen('window', 'keyup.shift.z', () => { this.onUndo(); });
    this._renderer.listen('window', 'keyup.shift.o', () => { this.onOpenProject(); });
    this._renderer.listen('window', 'keyup.shift.s', () => { this.onSaveProject(); });
    this._renderer.listen('window', 'keyup.delete', () => { this.onEraseSelection(); });
    this._renderer.listen('window', 'keyup.backspace', () => { this.onEraseSelection(); });
    this._renderer.listen('window', 'keyup.shift.c', () => { this.onCopySelection(); });
    this._renderer.listen('window', 'keyup.shift.v', () => { this.onPaste(); });
    this._renderer.listen('window', 'keyup.shift.x', () => { this.onCutSelection(); });
    this._renderer.listen('window', 'keyup.shift.d', () => { this.onDuplicate(); });
    this._renderer.listen('window', 'keyup.shift.a', () => { this.onInsert(); });
    this._renderer.listen('window', 'keyup.shift.t', () => { this.onEdit(); });
    this._renderer.listen('window', 'keyup.shift.e', () => { this.onExportAsImage(); });

  }

  public onMouseEnter(tooltip: HTMLElement) {

    tooltip.classList.add('expanded');

  }

  public onMouseLeave(tooltip: HTMLElement) {

    tooltip.classList.remove('expanded');

  }

  public onSelectTool(tool: Tools) {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;

    this._toolbar.selectedTool = tool;

  }

  public onResetCanvasPosition() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;

    this._canvas.resetCanvasPosition();

  }

  public onHelp() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;

    this._modal.openModal(ModalType.Help)
    .catch(console.error);

  }

  public onUndo() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;

    this._state.undo();

  }

  public onOpenProject() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;

    this._state.import();

  }

  public onSaveProject() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;

    this._state.export();

  }

  public onEraseSelection() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;
    if ( this._toolbar.selectedTool !== Tools.Select ) return;

    this._toolbar.deleteSelectedItems();

  }

  public onCopySelection() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;
    if ( this._toolbar.selectedTool !== Tools.Select ) return;

    this._toolbar.copySelected();

  }

  public onPaste() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;
    if ( this._toolbar.selectedTool !== Tools.Select ) return;

    this._toolbar.paste();

  }

  public onCutSelection() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;
    if ( this._toolbar.selectedTool !== Tools.Select ) return;

    this._toolbar.cutSelected();

  }

  public onDuplicate() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;
    if ( this._toolbar.selectedTool !== Tools.Select ) return;

    this._toolbar.duplicateSelected();

  }

  public onInsert() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;
    if ( this._toolbar.selectedTool !== Tools.Select ) return;

    this._toolbar.insertIntoSelected();

  }

  public onEdit() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;
    if ( this._toolbar.selectedTool !== Tools.Select ) return;

    this._toolbar.editSelected();

  }

  public onExportAsImage() {

    if ( this._modal.currentModal !== null || this._canvas.canvasMoveMode ) return;

    this._modal.openModal(ModalType.Spinner);

    this._toolbar.saveCanvasAsImage(250)
    .catch(console.error)
    .finally(() => this._modal.closeModal());

  }

}
