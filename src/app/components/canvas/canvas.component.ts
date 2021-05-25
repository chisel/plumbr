import { Component, OnInit, HostListener } from '@angular/core';
import { CanvasService } from '@plumbr/service/canvas';
import { ToolbarService, Tools, SelectedItem } from '@plumbr/service/toolbar';
import {
  StateService,
  PipelineData,
  ModuleData,
  ModuleFieldData,
  ModuleFieldOperationType,
  PipelineLink,
  NoteData
} from '@plumbr/service/state';
import {
  ModalService,
  ModalType,
  PipelineContext,
  ModuleContext,
  ModuleFieldContext,
  NoteContext
} from '@plumbr/service/modal';

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
  public selectedTool: Tools;
  public Tools = Tools;
  public data: PipelineData[] = [];
  public moduleHovered: boolean = false;
  public moduleFieldHovered: boolean = false;
  public noteMoving: boolean = false;
  public pipelineMoving: boolean = false;
  public pipelineStackMoving: boolean = false;
  public moduleStackMoving: boolean = false;
  public selection: SelectedItem[] = [];
  public currentScale: number;
  public currentLinkNode: number = -1;
  public links: PipelineLink[] = [];
  public notes: NoteData[] = [];

  private _lastCanvasX: number = 0;
  private _lastCanvasY: number = 0;

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

    // Capture last known mous coordinates
    const lastX = this._lastCanvasX;
    const lastY = this._lastCanvasY;

    // Update last known mouse coordinates
    this._lastCanvasX = event.clientX;
    this._lastCanvasY = event.clientY;

    if ( ! this.canvasMoveMode ) return;

    // Ignore if left click button is not held
    if ( event.buttons !== 1 ) {

      this._canvas.canvasMoving = false;
      return;

    }

    this._canvas.canvasMoving = true;
    event.preventDefault();

    // Move the canvas
    this.canvasLeft = Math.min(this.canvasLeft + (event.clientX - lastX), 0);
    this.canvasTop = Math.min(this.canvasTop + (event.clientY - lastY), 0);

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
    private _canvas: CanvasService,
    private _toolbar: ToolbarService,
    private _state: StateService,
    private _modal: ModalService
  ) { }

  ngOnInit(): void {

    // Update canvas status
    this._canvas.canvasEnabled$(enabled => this.canvasEnabled = enabled);

    // Update canvas move mode
    this._canvas.canvasMoveMode$(enabled => this.canvasMoveMode = enabled);

    // Update canvas moving mode
    this._canvas.canvasMoving$(enabled => this.canvasMoving = enabled);

    // Update selected tool
    this._toolbar.selectedTool$(selected => this.selectedTool = selected);

    // Update data
    this._state.data$(data => this.data = data);

    // Listen to modal events to toggle canvas state
    this._modal.onModalOpen$(() => this._canvas.canvasEnabled = false);
    this._modal.onModalClosed$(() => this._canvas.canvasEnabled = true);

    // Register event handler for canvas position reset
    this._canvas.onCanvasReset$(() => {

      this.canvasTop = 0;
      this.canvasLeft = 0;
      this.canvasWidthAddition = 0;
      this.canvasHeightAddition = 0;
      this.canvasMoveMode = false;
      this.canvasMoving = false;

    });

    // Update selection
    this._toolbar.selection$(selection => this.selection = selection);

    // Update currentScale
    this._canvas.currentScale$(newScale => this.currentScale = newScale);

    // Update currentLinkNode
    this._toolbar.currentLinkNode$(index => this.currentLinkNode = index);

    // Update links
    this._state.links$(links => this.links = links);

    // Update notes
    this._state.notes$(notes => this.notes = notes);

  }

  public onElementMovementStart(item: 'pipeline'|'note') {

    this._canvas.canvasEnabled = false;
    this._canvas.overlaysEnabled = false;
    this._canvas.shortcutsDisabled = true;

    if ( item === 'pipeline' ) this.pipelineMoving = true;
    else if ( item === 'note' ) this.noteMoving = true;

  }

  public onElementMovementEnd(element: HTMLElement, item: 'pipeline'|'note', index: number) {

    this._canvas.canvasEnabled = true;
    this._canvas.overlaysEnabled = true;
    this._canvas.shortcutsDisabled = false;

    if ( item === 'pipeline' ) {

      this.pipelineMoving = false;

      // Update pipeline position
      this._state.updatePipelinePosition(
        index,
        +element.style.left.substr(0, element.style.left.length - 2) / this.currentScale,
        +element.style.top.substr(0, element.style.top.length - 2) / this.currentScale
      );

    }
    else if ( item === 'note' ) {

      this.noteMoving = false;

      // Update note position
      this._state.updateNotePosition(
        index,
        +element.style.left.substr(0, element.style.left.length - 2) / this.currentScale,
        +element.style.top.substr(0, element.style.top.length - 2) / this.currentScale
      );

    }

  }

  public onCanvasClick(event: MouseEvent) {

    if ( ! this.canvasEnabled || this.canvasMoveMode ) return;

    // Insert a new pipeline
    if ( this.selectedTool === Tools.Insert ) {

      const left = (event.clientX / this.currentScale) + Math.abs(this.canvasLeft) - 345;
      const top = (event.clientY / this.currentScale) + Math.abs(this.canvasTop);

      this._modal.openModal(ModalType.Pipeline)
      .then(data => {

        if ( ! data ) return;

        this._state.newPipeline(
          data.name,
          Math.floor(left / 15) * 15,
          Math.floor(top / 15) * 15,
          data.description
        );

      })
      .catch(console.error);

    }
    // Inser a new note
    else if ( this.selectedTool === Tools.Note ) {

      const left = (event.clientX / this.currentScale) + Math.abs(this.canvasLeft);
      const top = (event.clientY / this.currentScale) + Math.abs(this.canvasTop) - (45 / 2);

      this._modal.openModal(ModalType.Note)
      .then(data => {

        if ( ! data ) return;

        this._state.newNote(
          data.name,
          data.description,
          Math.floor(left / 15) * 15,
          Math.floor(top / 15) * 15
        );

      })
      .catch(console.error);

    }
    // Deselect items
    else if ( this.selectedTool === Tools.Select ) {

      this._toolbar.clearSelection();

    }

  }

  public onCanvasWheel(event: WheelEvent) {

    if ( ! this.canvasEnabled || this.canvasMoveMode || ! event.shiftKey ) return;

    event.preventDefault();

    const scaleDown = event.deltaY > 0;

    this._canvas.currentScale = this._canvas.currentScale + (scaleDown ? -.1 : .1);

  }

  public onNoteClick(event: MouseEvent, index: number) {

    if ( this.canvasMoveMode ) return;

    if ( this._toolbar.selectedTool === Tools.Note ) {

      event.stopImmediatePropagation();

      this._toolbar.cycleNoteColor(index);

    }
    else if ( this._toolbar.selectedTool === Tools.Erase ) {

      event.stopImmediatePropagation();

      this._state.deleteNote(index);

    }
    else if ( this._toolbar.selectedTool === Tools.Edit ) {

      event.stopImmediatePropagation();

      this._modal.openModal<NoteContext>(ModalType.Note, {
        name: this.notes[index].name,
        description: this.notes[index].description
      })
      .then((data: NoteData) => {

        if ( ! data ) return;

        this._state.updateNote(index, data.name, data.description);

      })
      .catch(console.error);

    }
    else if ( this._toolbar.selectedTool === Tools.Select ) {

      event.stopImmediatePropagation();

      if ( event.shiftKey ) this._toolbar.addToSelection({ noteIndex: index });
      else this._toolbar.setSelection({ noteIndex: index });

    }

  }

  public onNoteDoubleClick(event: MouseEvent, index: number) {

    if ( this.canvasMoveMode ) return;

    event.stopImmediatePropagation();

    if ( this._toolbar.selectedTool === Tools.Select ) {

      this._modal.openModal(ModalType.Prompt, {
        title: `${this.notes[index].name} Note`,
        message: this.notes[index].description
      });

    }

  }

  public onPipelineClick(event: MouseEvent, index: number) {

    if ( this.canvasMoveMode ) return;

    if ( this._toolbar.selectedTool === Tools.Insert ) {

      event.stopImmediatePropagation();

      this._modal.openModal(ModalType.Module)
      .then((data: ModuleData) => {

        if ( ! data ) return;

        this._state.newModule(index, data.name, data.type, data.description);

      })
      .catch(console.error);

    }
    else if ( this._toolbar.selectedTool === Tools.Erase ) {

      event.stopImmediatePropagation();

      this._state.deletePipeline(index);
      this.moduleHovered = false;
      this.moduleFieldHovered = false;

    }
    else if ( this._toolbar.selectedTool === Tools.Select ) {

      event.stopImmediatePropagation();

      if ( event.shiftKey ) this._toolbar.addToSelection({ pipelineIndex: index });
      else this._toolbar.setSelection({ pipelineIndex: index });

    }
    else if ( this._toolbar.selectedTool === Tools.Edit ) {

      event.stopImmediatePropagation();

      this._modal.openModal<PipelineContext>(ModalType.Pipeline, {
        name: this.data[index].name,
        description: this.data[index].description
      })
      .then((data: PipelineData) => {

        if ( ! data ) return;

        this._state.updatePipelineData(index, data.name, data.description);

      })
      .catch(console.error);

    }
    else if ( this._toolbar.selectedTool === Tools.Link ) {

      event.stopImmediatePropagation();

      this._toolbar.addLinkNode(index);

    }
    else if ( this._toolbar.selectedTool === Tools.Note ) {

      event.stopImmediatePropagation();

    }

  }

  public onPipelineDoubleClick(event: MouseEvent, index: number) {

    if ( this.canvasMoveMode ) return;

    event.stopImmediatePropagation();

    if ( this._toolbar.selectedTool === Tools.Select ) {

      this._modal.openModal(ModalType.Prompt, {
        title: `${this.data[index].name} Pipeline`,
        message: this.data[index].description
      });

    }

  }

  public onPipelineMovement(index: number) {

    this._toolbar.repositionPipelineLinks(index);

  }

  public onModuleClick(event: MouseEvent, index: number, mindex: number) {

    if ( this.canvasMoveMode ) return;

    if ( this._toolbar.selectedTool === Tools.Insert ) {

      event.stopImmediatePropagation();

      this._modal.openModal(ModalType.ModuleField)
      .then((data: ModuleFieldData) => {

        if ( ! data ) return;

        this._state.newField(
          index,
          mindex,
          data.operation,
          data.target,
          data.type,
          data.conditional,
          data.description
        );

      })
      .catch(console.error);

    }
    else if ( this._toolbar.selectedTool === Tools.Erase ) {

      event.stopImmediatePropagation();

      this._state.deleteModule(index, mindex);
      this.moduleHovered = false;
      this.moduleFieldHovered = false;

    }
    else if ( this._toolbar.selectedTool === Tools.Select ) {

      event.stopImmediatePropagation();

      if ( event.shiftKey ) this._toolbar.addToSelection({
        pipelineIndex: index,
        moduleIndex: mindex
      });
      else this._toolbar.setSelection({
        pipelineIndex: index,
        moduleIndex: mindex
      });

    }
    else if ( this._toolbar.selectedTool === Tools.Edit ) {

      event.stopImmediatePropagation();

      this._modal.openModal<ModuleContext>(ModalType.Module, {
        name: this.data[index].modules[mindex].name,
        type: this.data[index].modules[mindex].type,
        description: this.data[index].modules[mindex].description
      })
      .then((data: ModuleData) => {

        if ( ! data ) return;

        this._state.updateModuleData(index, mindex, data.name, data.type, data.description);

      })
      .catch(console.error);

    }

  }

  public onModuleDoubleClick(event: MouseEvent, index: number, mindex: number) {

    if ( this.canvasMoveMode ) return;

    event.stopImmediatePropagation();

    if ( this._toolbar.selectedTool === Tools.Select ) {

      this._modal.openModal(ModalType.Prompt, {
        title: `${this.data[index].modules[mindex].name} Module`,
        message: this.data[index].modules[mindex].description
      });

    }

  }

  public onModuleFieldClick(event: MouseEvent, index: number, mindex: number, findex: number) {

    if ( this.canvasMoveMode ) return;

    if ( this._toolbar.selectedTool === Tools.Erase ) {

      event.stopImmediatePropagation();

      this._state.deleteModuleField(index, mindex, findex);
      this.moduleHovered = false;
      this.moduleFieldHovered = false;

    }
    else if ( this._toolbar.selectedTool === Tools.Select ) {

      event.stopImmediatePropagation();

      if ( event.shiftKey ) this._toolbar.addToSelection({
        pipelineIndex: index,
        moduleIndex: mindex,
        fieldIndex: findex
      });
      else this._toolbar.setSelection({
        pipelineIndex: index,
        moduleIndex: mindex,
        fieldIndex: findex
      });

    }
    else if ( this._toolbar.selectedTool === Tools.Edit ) {

      event.stopImmediatePropagation();

      this._modal.openModal<ModuleFieldContext>(ModalType.ModuleField, {
        operation: this.data[index].modules[mindex].fields[findex].operation,
        target: this.data[index].modules[mindex].fields[findex].target,
        type: this.data[index].modules[mindex].fields[findex].type,
        conditional: this.data[index].modules[mindex].fields[findex].conditional,
        description: this.data[index].modules[mindex].fields[findex].description
      })
      .then((data: ModuleFieldData) => {

        if ( ! data ) return;

        this._state.updateFieldData(index, mindex, findex, data.operation, data.target, data.type, data.conditional, data.description);

      })
      .catch(console.error);

    }

  }

  public onModuleFieldDoubleClick(event: MouseEvent, index: number, mindex: number, findex: number) {

    if ( this.canvasMoveMode ) return;

    event.stopImmediatePropagation();

    if ( this._toolbar.selectedTool === Tools.Select ) {

      this._modal.openModal(ModalType.Prompt, {
        title: `${this.data[index].modules[mindex].name} ${ModuleFieldOperationType[this.data[index].modules[mindex].fields[findex].operation]} Details`,
        message: this.data[index].modules[mindex].fields[findex].description
      });

    }

  }

  public onModuleMouseHover() {

    this.moduleHovered = true;

  }

  public onModuleMouseLeave() {

    this.moduleHovered = false;

  }

  public onModuleFieldMouseHover() {

    this.moduleFieldHovered = true;

  }

  public onModuleFieldMouseLeave() {

    this.moduleFieldHovered = false;

  }

  public onPipelineStackMoveStart() {

    this.pipelineStackMoving = true;
    this._canvas.canvasEnabled = false;
    this._canvas.shortcutsDisabled = true;
    this._canvas.overlaysEnabled = false;

  }

  public onPipelineStackMoveEnd() {

    this.pipelineStackMoving = false;
    this._canvas.canvasEnabled = true;
    this._canvas.shortcutsDisabled = false;
    this._canvas.overlaysEnabled = true;

  }

  public onModuleStackMoveStart() {

    this.moduleStackMoving = true;
    this._canvas.canvasEnabled = false;
    this._canvas.overlaysEnabled = false;
    this._canvas.shortcutsDisabled = true;

  }

  public onModuleStackMoveEnd() {

    this.moduleStackMoving = false;
    this._canvas.canvasEnabled = true;
    this._canvas.overlaysEnabled = true;
    this._canvas.shortcutsDisabled = false;

  }

  public onLinkClick(event: MouseEvent, index: number) {

    if ( this.canvasMoveMode ) return;

    if ( this._toolbar.selectedTool === Tools.Link )
      this._toolbar.cycleLinkColor(index);
    else if ( this._toolbar.selectedTool === Tools.Erase )
      this._toolbar.deleteLink(index);
    else if ( this._toolbar.selectedTool === Tools.Note )
      event.stopImmediatePropagation();

  }

  public isSelected(index: number, mindex?: number, findex?: number): boolean {

    return !! this.selection.find(
      item => item.pipelineIndex === index && item.moduleIndex === mindex && item.fieldIndex === findex
    );

  }

  public isNoteSelected(index: number): boolean {

    return !! this.selection.find(item => item.noteIndex === index);

  }

}
