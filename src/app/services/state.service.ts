import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { cloneDeep } from 'lodash-es';
import * as lz from 'lz-string';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  public static LOCALSTORAGE_KEY: string = 'plumbr-state';

  private _data: PipelineData[] = [];
  private _data$ = new BehaviorSubject<PipelineData[]>([]);
  private _history: PipelineData[][] = [];

  constructor() {

    // Load data from localstorage
    const stored = localStorage.getItem(StateService.LOCALSTORAGE_KEY);

    if ( ! stored ) return;

    this._data = JSON.parse(lz.decompress(stored));
    this._data$.next(this._data);

    console.log('State loaded from localstorage');

  }

  private _captureHistory() {

    this._history.push(cloneDeep(this._data));

    // Only keep the last 15 moves
    if ( this._history.length > 15 )
      this._history = this._history.slice(-15);

  }

  private _updateData(newValue: PipelineData[], skipHistory?: boolean) {

    // Add the current state to history
    if ( ! skipHistory ) this._captureHistory();
    // Set the data with the new value
    this._data = newValue;
    // Emit the data change to all subscribers
    this._data$.next(cloneDeep(this._data));
    // Saved the compressed version of the current state to localstorage
    const uncompressed = JSON.stringify(this._data);
    const compressed = lz.compress(uncompressed);
    localStorage.setItem(StateService.LOCALSTORAGE_KEY, compressed);

    console.log(`Saved state (original ${uncompressed.length} bytes | compressed ${compressed.length} bytes)`);

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
    description?: string
  ) {

    let newValue = this.data;

    newValue.push({
      name,
      description,
      modules: [],
      position: { left, top }
    });

    this._updateData(newValue);

  }

  public updatePipelinePosition(index: number, left: number, top: number) {

    let newValue = this.data;

    newValue[index].position = { left, top };

    this._updateData(newValue);

  }

  public newModule(
    pipelineIndex: number,
    name: string,
    type: ModuleType,
    description?: string
  ) {

    let newValue = this.data;

    newValue[pipelineIndex].modules.push({
      name,
      type,
      description,
      fields: []
    });

    this._updateData(newValue);

  }

  public newField(
    pipelineIndex: number,
    moduleIndex: number,
    operation: ModuleFieldOperationType,
    target: string,
    type: ModuleFieldType,
    conditional?: true,
    description?: string
  ) {

    let newValue = this.data;

    newValue[pipelineIndex].modules[moduleIndex].fields.push({
      operation,
      target,
      type,
      conditional,
      description
    });

    this._updateData(newValue);

  }

  public deletePipeline(index: number) {

    let newValue = this.data;

    newValue.splice(index, 1);

    this._updateData(newValue);

  }

  public deleteModule(index: number, mindex: number) {

    let newValue = this.data;

    newValue[index].modules.splice(mindex, 1);

    this._updateData(newValue);

  }

  public deleteModuleField(index: number, mindex: number, findex: number) {

    let newValue = this.data;

    newValue[index].modules[mindex].fields.splice(findex, 1);

    this._updateData(newValue);

  }

  public undo() {

    if ( ! this._history.length ) return;

    let newValue = this._history.pop() || this.data;

    this._updateData(newValue, true);

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
