import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { StateService, PipelineData, ModuleData, ModuleFieldData, NoteData, Color, Position } from './state.service';
import { ModalService, ModalType, PipelineContext, ModuleContext, ModuleFieldContext, NoteContext } from './modal.service';
import { CanvasService } from './canvas.service';
import { cloneDeep } from 'lodash-es';
import { toBlob } from 'html-to-image';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ToolbarService {

  public static COPY_PIPELINE_WIDTH_OFFSET: number = 735;
  public static COPY_PIPELINE_HEIGHT_OFFSET: number = 0;
  public static COPY_NOTE_HEIGHT_OFFSET: number = 60;
  public static NOTE_HEIGHT: number = 45;
  public static PIPELINE_WIDTH: number = 690;
  public static PIPELINE_HEIGHT: number = 66;
  public static PIPELINE_LINK_TOP_SHIFT = 18;

  private _selectedTool$ = new BehaviorSubject<Tools>(Tools.Select);
  private _selection$ = new BehaviorSubject<Array<SelectedItem>>([]);
  private _selectionType = SelectionType.Empty;
  private _clipboard: Array<PipelineData|ModuleData|ModuleFieldData|NoteData> = [];
  private _clipboardType = SelectionType.Empty;
  private _movementSkippedStateCapture: boolean = false;
  private _currentLinkNode: number = -1;
  private _currentLinkNode$ = new Subject<number>();
  private _onLinkNodesReposition = new EventEmitter<LinkNodesRepositionEvent>();

  constructor(
    private _state: StateService,
    private _modal: ModalService,
    private _canvas: CanvasService
  ) {

    // On tool change, clear selection
    this._selectedTool$.subscribe(() => {

      this.clearSelection();
      this._currentLinkNode = -1;
      this._currentLinkNode$.next(-1);

    });

    // On pipeline link positions outdated (give some time for the view to be updated)
    this._state.onLinksPositionOutdated(index => setTimeout(() => this.repositionPipelineLinks(index), 50));

  }

  private _getItemType(item: SelectedItem): SelectionType {

    if ( typeof item.fieldIndex === 'number' )
      return SelectionType.Field;
    else if ( typeof item.moduleIndex === 'number' )
      return SelectionType.Module;
    else if ( typeof item.pipelineIndex === 'number' )
      return SelectionType.Pipeline;
    else
      return SelectionType.Note;

  }

  private _createFieldClone(pipelineIndex: number, moduleIndex: number, targets: ModuleFieldData[]) {

    this._state.captureHistory();

    for ( const target of targets ) {

      this._state.newField(
        pipelineIndex,
        moduleIndex,
        target.operation,
        target.target,
        target.type,
        target.conditional,
        target.description,
        true
      );

    }

  }

  private _createModuleClone(pipelineIndex: number, targets: ModuleData[]) {

    this._state.captureHistory();

    for ( const target of targets ) {

      // Create a new module
      const moduleIndex = this._state.newModule(
        pipelineIndex,
        target.name,
        target.type,
        target.description,
        target.dependencies,
        true
      );

      // Create all module fields
      for ( const field of target.fields ) {

        this._state.newField(
          pipelineIndex,
          moduleIndex,
          field.operation,
          field.target,
          field.type,
          field.conditional,
          field.description,
          true
        );

      }

    }

  }

  private _createPipelineClone(targets: PipelineData[], position?: Position, spaceBetween?: Position) {

    this._state.captureHistory();

    let count = 0;

    for ( const target of targets ) {

      count++;

      // Create a new pipeline
      const pipelineIndex = this._state.newPipeline(
        target.name,
        position ? position.left + ((count > 1 ? spaceBetween?.left ?? 0 : 0) * (count - 1)) : target.position.left + ToolbarService.COPY_PIPELINE_WIDTH_OFFSET,
        position ? position.top + ((count > 1 ? spaceBetween?.top ?? 0 : 0) * (count - 1)) : target.position.top + ToolbarService.COPY_PIPELINE_HEIGHT_OFFSET,
        target.description,
        true
      );

      // Create all modules
      for ( const m of target.modules ) {

        const moduleIndex = this._state.newModule(
          pipelineIndex,
          m.name,
          m.type,
          m.description,
          m.dependencies,
          true
        );

        // Create all module fields
        for ( const field of m.fields ) {

          this._state.newField(
            pipelineIndex,
            moduleIndex,
            field.operation,
            field.target,
            field.type,
            field.conditional,
            field.description,
            true
          );

        }

      }

    }

  }

  private _createNoteClone(targets: NoteData[], position?: Position, spaceBetween?: Position) {

    this._state.captureHistory();

    let count = 0;

    for ( const target of targets ) {

      count++;

      // Create new note
      const noteIndex = this._state.newNote(
        target.name,
        target.description,
        position ? position.left + ((count > 1 ? spaceBetween?.left ?? 0 : 0) * (count - 1)) : target.position.left,
        position ? position.top + ((count > 1 ? spaceBetween?.top ?? 0 : 0) * (count - 1)) : target.position.top + ToolbarService.COPY_NOTE_HEIGHT_OFFSET,
        true,
        true
      );

      // Set color
      this._state.updateNoteColor(noteIndex, target.color, true);

    }

  }

  private _getPixelsValue(px: string): number {

    return +px.replace('px', '');

  }

  private _getCenterOfCanvas(offsetLeft: number = 0, offsetTop: number = 0): Position {

    const computed = window.getComputedStyle(document.getElementById('canvas'));
    const canvasLeft = this._getPixelsValue(computed.left);
    const canvasTop = this._getPixelsValue(computed.top);
    const canvasWidth = this._getPixelsValue(computed.width);
    const canvasHeight = this._getPixelsValue(computed.height);
    const left = (Math.abs(canvasLeft) + ((canvasWidth - Math.abs(canvasLeft)) / 2) - (offsetLeft * this._canvas.currentScale)) / this._canvas.currentScale;
    const top = (Math.abs(canvasTop) + ((canvasHeight - Math.abs(canvasTop)) / 2) - (offsetTop * this._canvas.currentScale)) / this._canvas.currentScale;

    return { top, left };

  }

  public get selectedTool() {

    return this._selectedTool$.value;

  }

  public set selectedTool(newValue: Tools) {

    // Ignore changing the tool if the new value is the same
    if ( this._selectedTool$.value === newValue ) return;

    this._selectedTool$.next(newValue);

  }

  public selectedTool$(observer: (selected: Tools) => void) {

    return this._selectedTool$.subscribe(observer);

  }

  public clearClipboard() {

    this._clipboardType = SelectionType.Empty;
    this._clipboard = [];

  }

  public copySelected(autoClear: boolean = true) {

    this._clipboardType = this._selectionType;
    this._clipboard = this._selection$.value.map(item => {

      const itemType = this._getItemType(item);

      if ( itemType === SelectionType.Pipeline )
        return this._state.data[item.pipelineIndex];
      else if ( itemType === SelectionType.Module )
        return this._state.data[item.pipelineIndex].modules[item.moduleIndex];
      else if ( itemType === SelectionType.Field )
        return this._state.data[item.pipelineIndex].modules[item.moduleIndex].fields[item.fieldIndex];
      else
        return this._state.notes[item.noteIndex];

    });

    if ( autoClear ) this.clearSelection();

  }

  public cutSelected() {

    this.copySelected(false);
    this.deleteSelectedItems();

  }

  public get selection() {

    return cloneDeep(this._selection$.value);

  }

  public clearSelection() {

    // Ignore if nothing selected
    if ( this._selectionType === SelectionType.Empty ) return;

    this._selectionType = SelectionType.Empty;
    this._selection$.next([]);

  }

  public addToSelection(newItem: SelectedItem) {

    let newValue = cloneDeep(this._selection$.value);

    // Empty selection
    if ( this._selectionType === SelectionType.Empty ) {

      newValue.push(cloneDeep(newItem));
      this._selectionType = this._getItemType(newItem);

    }
    // Non-empty selection
    else {

      // If new item has a different type
      if ( this._getItemType(newItem) !== this._selectionType )
        return this.setSelection(newItem);

      // Search for the new item in the previous selection
      const duplicateIndex = this._selection$.value.findIndex(item => {

        return item.pipelineIndex === newItem.pipelineIndex &&
        item.moduleIndex === newItem.moduleIndex &&
        item.fieldIndex === newItem.fieldIndex &&
        item.noteIndex === newItem.noteIndex;

      });

      // If duplicate, deselect
      if ( duplicateIndex !== -1 )
        newValue.splice(duplicateIndex, 1);
      // Otherwise, add to selection
      else
        newValue.push(cloneDeep(newItem));

    }

    this._selection$.next(newValue);

  }

  public setSelection(item: SelectedItem) {

    this._selectionType = this._getItemType(item);
    this._selection$.next(cloneDeep([item]));

  }

  public selection$(observer: (selection: SelectedItem[]) => void) {

    return this._selection$.subscribe(observer);

  }

  public deleteSelectedItems() {

    if ( this._selectionType === SelectionType.Empty )
      return;
    else if ( this._selectionType === SelectionType.Field )
      this._state.bulkDeleteModuleField(<any>this._selection$.value)
    else if ( this._selectionType === SelectionType.Module )
      this._state.bulkDeleteModule(<any>this._selection$.value)
    else if ( this._selectionType === SelectionType.Pipeline )
      this._state.bulkDeletePipeline(<any>this._selection$.value);
    else if ( this._selectionType === SelectionType.Note )
      this._state.bulkDeleteNote(<any>this._selection$.value);

    this.clearSelection();

  }

  public paste() {

    // If empty clipboard, ignore
    if ( this._clipboardType === SelectionType.Empty ) return;

    // Pasting module fields into modules
    if ( this._clipboardType === SelectionType.Field && this._selectionType === SelectionType.Module ) {

      // For each selected module
      for ( const dest of this._selection$.value ) {

        this._createFieldClone(dest.pipelineIndex, dest.moduleIndex, <ModuleFieldData[]>this._clipboard);

      }

      this.clearSelection();

    }
    // Pasting modules into pipelines
    else if ( this._clipboardType === SelectionType.Module && this._selectionType === SelectionType.Pipeline ) {

      // For each selected pipeline
      for ( const dest of this._selection$.value ) {

        this._createModuleClone(dest.pipelineIndex, <ModuleData[]>this._clipboard);

      }

      this.clearSelection();

    }
    // Pasting pipelines into canvas
    else if ( this._clipboardType === SelectionType.Pipeline && this._selectionType === SelectionType.Empty ) {

      const center = this._getCenterOfCanvas(
        ((ToolbarService.PIPELINE_WIDTH * this._clipboard.length) + ((ToolbarService.COPY_PIPELINE_WIDTH_OFFSET - ToolbarService.PIPELINE_WIDTH) * (this._clipboard.length - 1))) / 2,
        ToolbarService.PIPELINE_HEIGHT / 2
      );

      this._createPipelineClone(<PipelineData[]>this._clipboard, {
        left: Math.floor(center.left / 15) * 15,
        top: Math.floor(center.top / 15) * 15
      }, {
        left: ToolbarService.COPY_PIPELINE_WIDTH_OFFSET,
        top: 0
      });

      this.clearSelection();

    }
    // Pasting notes into canvas
    else if ( this._clipboardType === SelectionType.Note && this._selectionType === SelectionType.Empty ) {

      const center = this._getCenterOfCanvas(0, ((ToolbarService.NOTE_HEIGHT * this._clipboard.length) + ((this._clipboard.length - 1) * (ToolbarService.COPY_NOTE_HEIGHT_OFFSET - ToolbarService.NOTE_HEIGHT))) / 2);

      this._createNoteClone(<NoteData[]>this._clipboard, {
        left: Math.floor(center.left / 15) * 15,
        top: Math.floor(center.top / 15) * 15
      }, {
        left: 0,
        top: ToolbarService.COPY_NOTE_HEIGHT_OFFSET
      });

      this.clearSelection();

    }

  }

  public duplicateSelected() {

    // If empty selection, ignore
    if ( this._selectionType === SelectionType.Empty ) return;

    // Duplicate module fields in their own containers
    if ( this._selectionType === SelectionType.Field ) {

      for ( const item of this._selection$.value ) {

        this._createFieldClone(
          item.pipelineIndex,
          item.moduleIndex,
          [this._state.data[item.pipelineIndex].modules[item.moduleIndex].fields[item.fieldIndex]]
        );

      }

    }
    // Duplicate modules in their own containers
    else if ( this._selectionType === SelectionType.Module ) {

      for ( const item of this._selection$.value ) {

        this._createModuleClone(
          item.pipelineIndex,
          [this._state.data[item.pipelineIndex].modules[item.moduleIndex]]
        );

      }

    }
    // Duplicate pipelines
    else if ( this._selectionType === SelectionType.Pipeline ) {

      for ( const item of this._selection$.value ) {

        this._createPipelineClone(
          [this._state.data[item.pipelineIndex]]
        );

      }

    }
    // Duplicate notes
    else if ( this._selectionType === SelectionType.Note ) {

      for ( const item of this._selection$.value ) {

        this._createNoteClone(
          [this._state.notes[item.noteIndex]]
        );

      }

    }

    this.clearSelection();

  }

  public insertIntoSelected() {

    // Inserting into canvas
    if ( this._selectionType === SelectionType.Empty ) {

      this._modal.openModal(ModalType.Pipeline)
      .then(data => {

        if ( ! data ) return;

        const center = this._getCenterOfCanvas(ToolbarService.PIPELINE_WIDTH / 2, ToolbarService.PIPELINE_HEIGHT);

        this._state.newPipeline(
          data.name,
          Math.floor(center.left / 15) * 15,
          Math.floor(center.top / 15) * 15,
          data.description
        );

      })
      .catch(console.error);

    }
    // Inserting into pipeline (single select only)
    else if ( this._selection$.value.length === 1 && this._selectionType === SelectionType.Pipeline ) {

      this._modal.openModal(ModalType.Module)
      .then(data => {

        if ( ! data ) return;

        this._state.newModule(
          this._selection$.value[0].pipelineIndex,
          data.name,
          data.type,
          data.description,
          data.dependencies
        );

      })
      .catch(console.error);

    }
    // Inserting into module (single select only)
    else if ( this._selection$.value.length === 1 && this._selectionType === SelectionType.Module ) {

      this._modal.openModal(ModalType.ModuleField)
      .then(data => {

        if ( ! data ) return;

        this._state.newField(
          this._selection$.value[0].pipelineIndex,
          this._selection$.value[0].moduleIndex,
          data.operation,
          data.target,
          data.type,
          data.conditional,
          data.description
        );

      })
      .catch(console.error);

    }

  }

  public editSelected() {

    // Only single selected element allowed
    if ( this._selection$.value.length !== 1 ) return;

    // Editing pipeline
    if ( this._selectionType === SelectionType.Pipeline ) {

      const index = this._selection$.value[0].pipelineIndex;
      const pipeline = this._state.data[index];

      this._modal.openModal<PipelineContext>(ModalType.Pipeline, {
        name: pipeline.name,
        description: pipeline.description
      })
      .then((data: PipelineData) => {

        if ( ! data ) return;

        this._state.updatePipelineData(index, data.name, data.description);

      })
      .catch(console.error)
      .finally(() => this.clearSelection());

    }
    // Editing module
    else if ( this._selectionType === SelectionType.Module ) {

      const index = this._selection$.value[0].pipelineIndex;
      const mindex = this._selection$.value[0].moduleIndex;
      const module = this._state.data[index].modules[mindex];

      this._modal.openModal<ModuleContext>(ModalType.Module, {
        name: module.name,
        type: module.type,
        description: module.description,
        dependencies: module.dependencies
      })
      .then((data: ModuleData) => {

        if ( ! data ) return;

        this._state.updateModuleData(index, mindex, data.name, data.type, data.description, data.dependencies);

      })
      .catch(console.error)
      .finally(() => this.clearSelection());

    }
    // Editing module field
    else if ( this._selectionType === SelectionType.Field ) {

      const index = this._selection$.value[0].pipelineIndex;
      const mindex = this._selection$.value[0].moduleIndex;
      const findex = this._selection$.value[0].fieldIndex;
      const field = this._state.data[index].modules[mindex].fields[findex];

      this._modal.openModal<ModuleFieldContext>(ModalType.ModuleField, {
        operation: field.operation,
        target: field.target,
        type: field.type,
        conditional: field.conditional,
        description: field.description
      })
      .then((data: ModuleFieldData) => {

        if ( ! data ) return;

        this._state.updateFieldData(
          index,
          mindex,
          findex,
          data.operation,
          data.target,
          data.type,
          data.conditional,
          data.description
        );

      })
      .catch(console.error)
      .finally(() => this.clearSelection());

    }
    // Editting note
    else if ( this._selectionType === SelectionType.Note ) {

      const index = this._selection$.value[0].noteIndex;
      const note = this._state.notes[index];

      this._modal.openModal<NoteContext>(ModalType.Note, {
        name: note.name,
        description: note.description
      })
      .then((data: NoteData) => {

        if ( ! data ) return;

        this._state.updateNote(
          index,
          data.name,
          data.description
        );

      })
      .catch(console.error)
      .finally(() => this.clearSelection());

    }

  }

  public async saveCanvasAsImage(initialDelay: number = 0) {

    // Ignore saving an empty canvas
    if ( ! this._state.data.length ) return;

    const canvas = document.getElementById('canvas');

    // Hide canvas
    canvas.style.transition = 'opacity .25s ease-in-out';
    canvas.style.opacity = '0';

    // Clear selection
    this.clearSelection();

    // Introduce delay (used for spinner modal animation)
    if ( initialDelay )
      await new Promise(resolve => setTimeout(resolve, initialDelay));

    // Temporarily change scale
    const originalScale = this._canvas.currentScale;

    this._canvas.currentScale = CanvasService.SCALE_DEFAULT;

    // Wait for 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    // Temporarily reposition elements
    this._state.captureHistory();

    // Find bounding positions from all sides
    const pipelines = this._state.data;
    const elements = document.querySelectorAll('app-pipeline');
    const PIPELINE_HEADER_EXTRA_HEIGHT = +window.getComputedStyle(document.querySelector('.pipeline .pipeline-name')).height.replace('px', '') / 2;
    const IMAGE_CANVAS_PADDING = 50;
    const canvasLeft = canvas.style.left;
    const canvasTop = canvas.style.top;
    let mostLeft: number = null, mostRight: number = null, mostTop: number = null, mostBottom: number = null;

    for ( let i = 0; i < elements.length; i++ ) {

      const computed = window.getComputedStyle(elements.item(i));
      const computedLeft = +computed.left.replace('px', '');
      const computedTop = +computed.top.replace('px', '');
      const computedWidth = +computed.width.replace('px', '');
      const computedHeight = +computed.height.replace('px', '') + PIPELINE_HEADER_EXTRA_HEIGHT;

      if ( mostLeft === null || computedLeft < mostLeft )
        mostLeft = computedLeft;
      if ( mostRight === null || computedLeft + computedWidth > mostRight )
        mostRight = computedLeft + computedWidth;
      if ( mostTop === null || computedTop < mostTop )
        mostTop = computedTop;
      if ( mostBottom === null || computedTop + computedHeight > mostBottom )
        mostBottom = computedTop + computedHeight;

    }

    // Reposition pipelines
    for ( let i = 0; i < pipelines.length; i++ ) {

      const pipeline = pipelines[i];

      this._state.updatePipelinePosition(
        i,
        pipeline.position.left - mostLeft + IMAGE_CANVAS_PADDING,
        pipeline.position.top - mostTop + PIPELINE_HEADER_EXTRA_HEIGHT + IMAGE_CANVAS_PADDING,
        true,
        true
      );

    }

    // Wait for 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    // Reposition links
    for ( let i = 0; i < pipelines.length; i++ ) {

      this.repositionPipelineLinks(i);

    }

    // Wait for 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    // Reposition canvas
    canvas.style.left = '0px';
    canvas.style.top = '0px';

    // Hide notes
    const notesCount = this._state.notes.length;

    for ( let i = 0; i < notesCount; i++ ) {

      const element = document.getElementById(`note${i}`);

      element.style.opacity = '0';

    }

    // Hide indicator dots (info only)
    const dots: NodeListOf<HTMLElement> = document.querySelectorAll('.indicator-dot.info:not(.conditional)');

    for ( let i = 0; i < dots.length; i++ ) {

      dots[i].style.display = 'none';

    }

    // Render image from canvas
    const blob = await toBlob(canvas, {
      height: mostBottom - mostTop + (IMAGE_CANVAS_PADDING * 2),
      width: mostRight - mostLeft + (IMAGE_CANVAS_PADDING * 2),
      backgroundColor: 'white',
      style: {
        opacity: '1',
        backgroundImage: ''
      },
      // Filter out .indicator-dot:not(.conditional)
      filter: node => ! node.classList || ! node.classList.contains('indicator-dot') || node.classList.contains('conditional')
    });

    // Restore original scale
    this._canvas.currentScale = originalScale;

    // Restore previous element positions
    canvas.style.left = canvasLeft;
    canvas.style.top = canvasTop;
    canvas.style.transition = '';
    canvas.style.opacity = '1';
    this._state.undo(true);

    // Reveal notes
    for ( let i = 0; i < notesCount; i++ ) {

      const element = document.getElementById(`note${i}`);

      element.style.opacity = '1';

    }

    // Reveal indicator dots (info only)
    for ( let i = 0; i < dots.length; i++ ) {

      dots[i].style.display = 'inline-block';

    }

    // Prompt save image
    saveAs(blob, 'plumbr.png');

  }

  public moveSelected(axis: 'x'|'y', value: number) {

    // Ignore on empty selection and multi selection
    if ( this._selectionType === SelectionType.Empty || this._selection$.value.length > 1 ) return;

    // Ignore moving anything but pipelines and notes on the X-axis
    if ( axis === 'x' && this._selectionType !== SelectionType.Pipeline && this._selectionType !== SelectionType.Note ) return;

    const selection = this._selection$.value[0];
    const data = this._state.data;

    // Move pipelines
    if ( this._selectionType === SelectionType.Pipeline ) {

      const pipeline = data[selection.pipelineIndex];

      // Skip out of bound movements
      if ( pipeline.position.left + value < 0 || pipeline.position.top + value < 0 ) return;

      this._state.updatePipelinePosition(
        selection.pipelineIndex,
        pipeline.position.left + (axis === 'x' ? value * CanvasService.GRID_SIZE : 0),
        pipeline.position.top + (axis === 'y' ? value * CanvasService.GRID_SIZE : 0),
        this._movementSkippedStateCapture,
        true
      );

      // Reposition pipeline links (while giving the view some time to refresh)
      setTimeout(() => this.repositionPipelineLinks(selection.pipelineIndex), 50);

    }
    else if ( this._selectionType === SelectionType.Module ) {

      // Skip out of bound movements
      if (
        selection.moduleIndex + value < 0 ||
        selection.moduleIndex + value >= data[selection.pipelineIndex].modules.length
      )
        return;

      this._state.updateModulePosition(
        selection.pipelineIndex,
        selection.moduleIndex,
        selection.moduleIndex + value,
        this._movementSkippedStateCapture,
        true
      );

      // Update current selection
      this.setSelection({
        ...selection,
        moduleIndex: selection.moduleIndex + value
      });

    }
    else if ( this._selectionType === SelectionType.Field ) {

      // Skip out of bound movements
      if (
        selection.fieldIndex + value < 0 ||
        selection.fieldIndex + value >= data[selection.pipelineIndex].modules[selection.moduleIndex].fields.length
      )
        return;

      this._state.updateFieldPosition(
        selection.pipelineIndex,
        selection.moduleIndex,
        selection.fieldIndex,
        selection.fieldIndex + value,
        this._movementSkippedStateCapture,
        true
      );

      // Update current selection
      this.setSelection({
        ...selection,
        fieldIndex: selection.fieldIndex + value
      });

    }
    else if ( this._selectionType === SelectionType.Note ) {

      const note = this._state.notes[selection.noteIndex];

      // Skip out of bound movements
      if ( note.position.left + value < 0 || note.position.top + value < 0 ) return;

      this._state.updateNotePosition(
        selection.noteIndex,
        note.position.left + (axis === 'x' ? value * CanvasService.GRID_SIZE : 0),
        note.position.top + (axis === 'y' ? value * CanvasService.GRID_SIZE : 0),
        this._movementSkippedStateCapture,
        true
      );

    }

    // Set flag _movementSkippedStateCapture to true so keyup event would capture history and save to localstorage
    this._movementSkippedStateCapture = true;

  }

  public get currentLinkNode() {

    return this._currentLinkNode;

  }

  public currentLinkNode$(observer: (index: number) => void) {

    return this._currentLinkNode$.subscribe(observer);

  }

  public endSelectedMovement() {

    if ( ! this._movementSkippedStateCapture ) return;

    this._movementSkippedStateCapture = false;
    this._state.saveDataToLocalstorage();

  }

  public findClosestPoints(element1: HTMLElement, element2: HTMLElement): ClosestPoints {

    // Get computed values
    const computed1 = window.getComputedStyle(element1);
    const computed2 = window.getComputedStyle(element2);

    // Calculate bounding boxes while taking scaling into account
    const box1 = {
      left: this._getPixelsValue(computed1.left) / this._canvas.currentScale,
      top: this._getPixelsValue(computed1.top) / this._canvas.currentScale,
      width: this._getPixelsValue(computed1.width),
      height: this._getPixelsValue(computed1.height)
    };
    const box2 = {
      left: this._getPixelsValue(computed2.left) / this._canvas.currentScale,
      top: this._getPixelsValue(computed2.top) / this._canvas.currentScale,
      width: this._getPixelsValue(computed2.width),
      height: this._getPixelsValue(computed2.height)
    };

    // Calculate center points on all sides
    const points1: PointMap = {
      left: { x: box1.left, y: box1.top + (box1.height / 2) },
      top: { x: box1.left + (box1.width / 2), y: box1.top - ToolbarService.PIPELINE_LINK_TOP_SHIFT },
      right: { x: box1.left + box1.width, y: box1.top + (box1.height / 2) },
      bottom: { x: box1.left + (box1.width / 2), y: box1.top + box1.height }
    };
    const points2: PointMap = {
      left: { x: box2.left, y: box2.top + (box2.height / 2) },
      top: { x: box2.left + (box2.width / 2), y: box2.top - ToolbarService.PIPELINE_LINK_TOP_SHIFT },
      right: { x: box2.left + box2.width, y: box2.top + (box2.height / 2) },
      bottom: { x: box2.left + (box2.width / 2), y: box2.top + box2.height }
    };

    // Find two points that are closest to each other
    const closest: ClosestPoints = {
      points: [null, null],
      distance: Infinity
    };

    for ( const side1 in points1 ) {

      for ( const side2 in points2 ) {

        const p1 = points1[side1];
        const p2 = points2[side2];
        const a = Math.abs(p1.x - p2.x);
        const b = Math.abs(p1.y - p2.y);
        const c = Math.sqrt(a**2 + b**2);

        if ( c < closest.distance ) {

          closest.points = [p1, p2];
          closest.distance = c;

        }

      }

    }

    return closest;

  }

  public addLinkNode(index: number) {

    // First node
    if ( this._currentLinkNode === -1 ) {

      this._currentLinkNode = index;
      this._currentLinkNode$.next(this._currentLinkNode);

    }
    // Second node (creating a link)
    else {

      // If current node is being added again, delete node (deselect)
      if ( index === this._currentLinkNode ) {

        this._currentLinkNode = -1;
        this._currentLinkNode$.next(-1);

        return;

      }

      const firstNode = this._currentLinkNode;

      // If link will be identical, ignore
      const links = this._state.links;

      for ( const link of links ) {

        if ( (link.nodes[0] === index && link.nodes[1] === firstNode) || (link.nodes[1] === index && link.nodes[0] === firstNode) )
          return;

      }

      this._currentLinkNode = -1;
      this._currentLinkNode$.next(-1);

      this._state.createLink(
        firstNode,
        index
      );

    }

  }

  public deleteLink(index: number) {

    this._state.deleteLink(index);

  }

  public editLink(index: number) {

    this._modal.openModal(ModalType.Link, { name: this._state.links[index].name })
    .then(data => {

      if ( ! data ) return;

      this._state.updateLinkText(index, data.name);

    })
    .catch(console.error);

  }

  public cycleLinkColor(index: number) {

    const maxColorValue = (Object.keys(Color).length / 2) - 1;
    const nextColor = this._state.links[index].color + 1;

    this._state.updateLinkColor(index, nextColor > maxColorValue ? 0 : nextColor);

  }

  public cycleNoteColor(index: number) {

    const maxColorValue = (Object.keys(Color).length / 2) - 1;
    const nextColor = this._state.notes[index].color + 1;

    this._state.updateNoteColor(index, nextColor > maxColorValue ? 0 : nextColor);

  }

  public repositionPipelineLinks(pipelineIndex: number) {

    // Find all links related to pipeline
    const links = this._state.links;

    for ( let i = 0; i < links.length; i++ ) {

      const link = links[i];

      if ( link.nodes[0] !== pipelineIndex && link.nodes[1] !== pipelineIndex )
        continue;

      const closest = this.findClosestPoints(
        document.getElementById(`pipeline${link.nodes[0]}`),
        document.getElementById(`pipeline${link.nodes[1]}`)
      );

      this._onLinkNodesReposition.emit({
        index: i,
        newPoints: closest.points,
        distance: closest.distance
      });

    }

  }

  public onLinkNodesReposition(observer: (event: LinkNodesRepositionEvent) => void) {

    return this._onLinkNodesReposition.subscribe(observer);

  }

}

export enum Tools {
  Select,
  Insert,
  Edit,
  Move,
  Link,
  Erase,
  Note
}

export interface SelectedItem {
  pipelineIndex?: number;
  moduleIndex?: number;
  fieldIndex?: number;
  noteIndex?: number;
}

export enum SelectionType {

  Empty,
  Pipeline,
  Module,
  Field,
  Note

}

export interface Point {

  x: number;
  y: number;

}

interface PointMap {

  [key: string]: Point;

}

export interface LinkNodesRepositionEvent {

  index: number;
  newPoints: [Point, Point];
  distance: number;

}

export interface ClosestPoints {

  points: [Point, Point];
  distance: number;

}
