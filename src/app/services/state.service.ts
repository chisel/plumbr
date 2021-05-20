import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { cloneDeep } from 'lodash-es';
import { compress, decompress } from 'lz-string';
import { saveAs as saveFile } from 'file-saver';
import { ModalService, ModalType } from './modal.service';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  public static LOCALSTORAGE_KEY: string = 'plumbr-state';

  private _data: PipelineData[] = [];
  private _data$ = new BehaviorSubject<PipelineData[]>([]);
  private _history: PipelineData[][] = [];
  /** Flag for export only and not localstorage. */
  private _unsavedChanges: boolean = false;

  constructor(
    private _modal: ModalService
  ) {

    // Load data from localstorage
    const stored = localStorage.getItem(StateService.LOCALSTORAGE_KEY);

    if ( ! stored ) return;

    this._data = JSON.parse(decompress(stored));
    this._data$.next(this._data);

    console.log('State loaded from localstorage');

  }

  private _updateData(newValue: PipelineData[], skipHistory?: boolean) {

    this._unsavedChanges = true;

    // Add the current state to history
    if ( ! skipHistory ) this.captureHistory();
    // Set the data with the new value
    this._data = newValue;
    // Emit the data change to all subscribers
    this._data$.next(cloneDeep(this._data));
    // Saved the compressed version of the current state to localstorage
    const uncompressed = JSON.stringify(this._data);
    const compressed = compress(uncompressed);
    localStorage.setItem(StateService.LOCALSTORAGE_KEY, compressed);

    console.log(`Saved state (original ${uncompressed.length} bytes | compressed ${compressed.length} bytes)`);

  }

  public captureHistory() {

    this._history.push(cloneDeep(this._data));

    // Only keep the last 15 moves
    if ( this._history.length > 15 )
      this._history = this._history.slice(-15);

  }

  public get data() {

    return cloneDeep(this._data);

  }

  public data$(observer: (data: PipelineData[]) => void) {

    return this._data$.subscribe(observer);

  }

  public newPipeline(
    name: string,
    left: number,
    top: number,
    description?: string,
    skipHistory?: boolean
  ): number {

    let newValue = this.data;

    newValue.push({
      name,
      description,
      modules: [],
      position: { left, top }
    });

    this._updateData(newValue, skipHistory);

    return this._data.length - 1;

  }

  public updatePipelinePosition(index: number, left: number, top: number) {

    let newValue = this.data;

    newValue[index].position = { left, top };

    this._updateData(newValue);

  }

  public updatePipelineData(index: number, name: string, description?: string) {

    let newValue = this.data;

    newValue[index].name = name;
    newValue[index].description = description;

    this._updateData(newValue);

  }

  public newModule(
    pipelineIndex: number,
    name: string,
    type: ModuleType,
    description?: string,
    skipHistory?: boolean
  ): number {

    let newValue = this.data;

    newValue[pipelineIndex].modules.push({
      name,
      type,
      description,
      fields: []
    });

    this._updateData(newValue, skipHistory);

    return this._data[pipelineIndex].modules.length - 1;

  }

  public updateModulePosition(pipelineIndex: number, oldIndex: number, newIndex: number) {

    let newValue = this.data;

    const old = newValue[pipelineIndex].modules.splice(oldIndex, 1)[0];
    newValue[pipelineIndex].modules.splice(newIndex, 0, old);

    this._updateData(newValue);

  }

  public updateModuleData(pipelineIndex: number, moduleIndex: number, name: string, type: ModuleType, description?: string) {

    let newValue = this.data;

    newValue[pipelineIndex].modules[moduleIndex].name = name;
    newValue[pipelineIndex].modules[moduleIndex].type = type;
    newValue[pipelineIndex].modules[moduleIndex].description = description;

    this._updateData(newValue);

  }

  public newField(
    pipelineIndex: number,
    moduleIndex: number,
    operation: ModuleFieldOperationType,
    target: string,
    type: ModuleFieldType,
    conditional?: true,
    description?: string,
    skipHistory?: boolean
  ): number {

    let newValue = this.data;

    newValue[pipelineIndex].modules[moduleIndex].fields.push({
      operation,
      target,
      type,
      conditional,
      description
    });

    this._updateData(newValue, skipHistory);

    return this._data[pipelineIndex].modules[moduleIndex].fields.length - 1;

  }

  public updateFieldPosition(pipelineIndex: number, moduleIndex: number, oldIndex: number, newIndex: number) {

    let newValue = this.data;

    const old = newValue[pipelineIndex].modules[moduleIndex].fields.splice(oldIndex, 1)[0];
    newValue[pipelineIndex].modules[moduleIndex].fields.splice(newIndex, 0, old);

    this._updateData(newValue);

  }

  public updateFieldData(
    pipelineIndex: number,
    moduleIndex: number,
    fieldIndex: number,
    operation: ModuleFieldOperationType,
    target: string,
    type: ModuleFieldType,
    conditional?: true,
    description?: string
  ) {

    let newValue = this.data;

    newValue[pipelineIndex].modules[moduleIndex].fields[fieldIndex].operation = operation;
    newValue[pipelineIndex].modules[moduleIndex].fields[fieldIndex].target = target;
    newValue[pipelineIndex].modules[moduleIndex].fields[fieldIndex].type = type;
    newValue[pipelineIndex].modules[moduleIndex].fields[fieldIndex].conditional = conditional;
    newValue[pipelineIndex].modules[moduleIndex].fields[fieldIndex].description = description;

    this._updateData(newValue);

  }

  public deletePipeline(index: number) {

    const newValue = this.data;

    newValue.splice(index, 1);

    this._updateData(newValue);

  }

  public bulkDeletePipeline(indices: { pipelineIndex: number }[]) {

    const newValue = this.data;

    for ( let i = 0; i < indices.length; i++ ) {

      const { pipelineIndex: index } = indices[i];
      // Calculate the index shift based on previously deleted items within the same container
      const shift = indices
      .slice(0, i)
      .filter(indice => indice.pipelineIndex < index)
      .length;

      newValue.splice(index - shift, 1);

    }

    this._updateData(newValue);

  }

  public deleteModule(index: number, mindex: number) {

    const newValue = this.data;

    newValue[index].modules.splice(mindex, 1);

    this._updateData(newValue);

  }

  public bulkDeleteModule(indices: { pipelineIndex: number, moduleIndex: number }[]) {

    const newValue = this.data;

    for ( let i = 0; i < indices.length; i++ ) {

      const { pipelineIndex: index, moduleIndex: mindex } = indices[i];
      // Calculate the index shift based on previously deleted items within the same container
      const shift = indices
      .slice(0, i)
      .filter(indice => indice.pipelineIndex === index && indice.moduleIndex < mindex)
      .length;

      newValue[index].modules.splice(mindex - shift, 1);

    }

    this._updateData(newValue);

  }

  public deleteModuleField(index: number, mindex: number, findex: number) {

    const newValue = this.data;

    newValue[index].modules[mindex].fields.splice(findex, 1);

    this._updateData(newValue);

  }

  public bulkDeleteModuleField(indices: { pipelineIndex: number, moduleIndex: number, fieldIndex: number }[]) {

    const newValue = this.data;

    for ( let i = 0; i < indices.length; i++ ) {

      const { pipelineIndex: index, moduleIndex: mindex, fieldIndex: findex } = indices[i];
      // Calculate the index shift based on previously deleted items within the same container
      const shift = indices
      .slice(0, i)
      .filter(indice => indice.pipelineIndex === index && indice.moduleIndex === mindex && indice.fieldIndex < findex)
      .length;

      newValue[index].modules[mindex].fields.splice(findex - shift, 1);

    }

    this._updateData(newValue);

  }

  public undo() {

    if ( ! this._history.length ) return;

    let newValue = this._history.pop() || this.data;

    this._updateData(newValue, true);

  }

  public async import() {

    // Check if there are unsaved changes
    if ( this._unsavedChanges ) {

      const confirmed: boolean = !! await this._modal.openModal(ModalType.Confirmation, {
        title: 'Project Import',
        message: 'All work done after the last export will be lost once another file is imported. Do you wish to proceed?'
      });

      if ( ! confirmed ) return;

    }

    // Create input element
    const input: HTMLInputElement = document.createElement('input');

    // Set properties of element
    input.setAttribute('type', 'file');
    input.style.display = 'none';

    // Attach event handler
    const handler = (event: any) => {

      const file = event.target.files[0];

      // Remove handlers if no files selected
      if ( ! file ) return input.removeAllListeners();

      // Read the content of the file
      const reader = new FileReader();

      // On file read
      reader.onload = event => {

        // Decompress the content
        const loadedRawData = <string>event.target.result;
        const loadedData = JSON.parse(decompress(loadedRawData));

        // Invalid data
        if ( loadedData === null ) throw new Error('Invalid import data!');

        // Load the data in app (skip setting history)
        this._updateData(loadedData, true);

        // Reset history
        this._history = [];

      };

      // On file read end
      reader.onloadend = () => {

        input.removeAllListeners();
        reader.removeAllListeners();

      };

      // Trigger file read
      reader.readAsText(file);

    };

    input.addEventListener('change', handler, false);
    input.addEventListener('click', () => {

      // Remove element from body
      document.body.removeChild(input);

    }, false);

    // Add the input element to body
    document.body.append(input);

    // Invoke click on the input (opens file dialog)
    input.click();

  }

  public export() {

    const blob = new Blob([
      compress(JSON.stringify(this.data))
    ], {
      type: 'text/plain;charset=utf-8'
    });

    saveFile(blob, 'plumbr.flow');

    this._unsavedChanges = false;

  }

  public refreshState() {

    this._data$.next(this.data);

  }

}

export interface PipelineData {

  name: string;
  description?: string;
  modules: ModuleData[];
  position: {
    left: number;
    top: number;
  };

}

export interface ModuleData {

  name: string;
  type: ModuleType;
  description?: string;
  fields: ModuleFieldData[];

}

export enum ModuleType {

  Scraper,
  Processor,
  Analyzer,
  Validator

}

export interface ModuleFieldData {

  target: string;
  type: ModuleFieldType,
  operation: ModuleFieldOperationType;
  conditional?: true;
  description?: string;

}

export enum ModuleFieldType {

  Collection,
  Dataset,
  File,
  Report,
  'REST API',
  Variable

}

export enum ModuleFieldOperationType {

  Read,
  Write,
  Create,
  Update,
  Append,
  Delete,
  Clean

}
