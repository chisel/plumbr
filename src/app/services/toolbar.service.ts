import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StateService, PipelineData, ModuleData, ModuleFieldData } from './state.service';
import { ModalService, ModalType, PipelineContext, ModuleContext, ModuleFieldContext } from './modal.service';
import { cloneDeep } from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class ToolbarService {

  public static COPY_PIPELINE_WIDTH_OFFSET: number = 735;
  public static COPY_PIPELINE_HEIGHT_OFFSET: number = 0;
  public static PIPELINE_WIDTH: number = 690;
  public static PIPELINE_HEIGHT: number = 66;

  private _selectedTool$ = new BehaviorSubject<Tools>(Tools.Select);
  private _selection$ = new BehaviorSubject<Array<SelectedItem>>([]);
  private _selectionType = SelectionType.Empty;
  private _clipboard: Array<PipelineData|ModuleData|ModuleFieldData> = [];
  private _clipboardType = SelectionType.Empty;

  constructor(
    private _state: StateService,
    private _modal: ModalService
  ) {

    // On tool change, clear selection
    this._selectedTool$.subscribe(() => {

      this.clearSelection();

    });

  }

  private _getItemType(item: SelectedItem): SelectionType {

    if ( typeof item.fieldIndex === 'number' )
      return SelectionType.Field;
    else if ( typeof item.moduleIndex === 'number' )
      return SelectionType.Module;
    else
      return SelectionType.Pipeline;

  }

  private _createFieldClone(pipelineIndex: number, moduleIndex: number, ...targets: ModuleFieldData[]) {

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

  private _createModuleClone(pipelineIndex: number, ...targets: ModuleData[]) {

    this._state.captureHistory();

    for ( const target of targets ) {

      // Create a new module
      const moduleIndex = this._state.newModule(
        pipelineIndex,
        target.name,
        target.type,
        target.description,
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

  private _createPipelineClone(...targets: PipelineData[]) {

    this._state.captureHistory();

    for ( const target of targets ) {

      // Create a new pipeline
      const pipelineIndex = this._state.newPipeline(
        target.name,
        target.position.left + ToolbarService.COPY_PIPELINE_WIDTH_OFFSET,
        target.position.top + ToolbarService.COPY_PIPELINE_HEIGHT_OFFSET,
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
      else
        return this._state.data[item.pipelineIndex].modules[item.moduleIndex].fields[item.fieldIndex];

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
        item.fieldIndex === newItem.fieldIndex;

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
    else
      this._state.bulkDeletePipeline(this._selection$.value);

    this.clearSelection();

  }

  public paste() {

    // If empty clipboard, ignore
    if ( this._clipboardType === SelectionType.Empty ) return;

    // Pasting module fields into modules
    if ( this._clipboardType === SelectionType.Field && this._selectionType === SelectionType.Module ) {

      // For each selected module
      for ( const dest of this._selection$.value ) {

        this._createFieldClone(dest.pipelineIndex, dest.moduleIndex, ...<ModuleFieldData[]>this._clipboard);

      }

      this.clearSelection();

    }
    // Pasting modules into pipelines
    else if ( this._clipboardType === SelectionType.Module && this._selectionType === SelectionType.Pipeline ) {

      // For each selected pipeline
      for ( const dest of this._selection$.value ) {

        this._createModuleClone(dest.pipelineIndex, ...<ModuleData[]>this._clipboard);

      }

      this.clearSelection();

    }
    // Pasting pipelines into canvas
    else if ( this._clipboardType === SelectionType.Pipeline && this._selectionType === SelectionType.Empty ) {

      this._createPipelineClone(...<PipelineData[]>this._clipboard);

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
          this._state.data[item.pipelineIndex].modules[item.moduleIndex].fields[item.fieldIndex]
        );

      }

    }
    // Duplicate modules in their own containers
    else if ( this._selectionType === SelectionType.Module ) {

      for ( const item of this._selection$.value ) {

        this._createModuleClone(
          item.pipelineIndex,
          this._state.data[item.pipelineIndex].modules[item.moduleIndex]
        );

      }

    }
    // Duplicate pipelines
    else if ( this._selectionType === SelectionType.Pipeline ) {

      for ( const item of this._selection$.value ) {

        this._createPipelineClone(
          this._state.data[item.pipelineIndex]
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

        // Calculate center of the canvas
        const computed = window.getComputedStyle(document.getElementById('canvas'));
        const canvasLeft = +computed.left.replace('px', '');
        const canvasTop = +computed.top.replace('px', '');
        const canvasWidth = +computed.width.replace('px', '');
        const canvasHeight = +computed.height.replace('px', '');
        const left = Math.abs(canvasLeft) + ((canvasWidth - Math.abs(canvasLeft)) / 2) - (ToolbarService.PIPELINE_WIDTH / 2);
        const top = Math.abs(canvasTop) + ((canvasHeight - Math.abs(canvasTop)) / 2) - (ToolbarService.PIPELINE_HEIGHT / 2);

        this._state.newPipeline(
          data.name,
          Math.floor(left / 15) * 15,
          Math.floor(top / 15) * 15,
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
          data.description
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
        description: module.description
      })
      .then((data: ModuleData) => {

        if ( ! data ) return;

        this._state.updateModuleData(index, mindex, data.name, data.type, data.description);

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

  }

}

export enum Tools {
  Select,
  Insert,
  Edit,
  Move,
  Link,
  Erase
}

export interface SelectedItem {
  pipelineIndex: number;
  moduleIndex?: number;
  fieldIndex?: number;
}

export enum SelectionType {

  Empty,
  Pipeline,
  Module,
  Field

}
