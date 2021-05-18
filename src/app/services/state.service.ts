import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { cloneDeep } from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private _data: PipelineData[] = [];
  private _data$ = new BehaviorSubject<PipelineData[]>([]);

  constructor() { }

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

    this._data.push({
      name,
      description,
      modules: [],
      position: { left, top }
    });

    this._data$.next(cloneDeep(this._data));

  }

  public updatePipelinePosition(index: number, left: number, top: number) {

    this._data[index].position = { left, top };

    this._data$.next(cloneDeep(this._data));

  }

  public newModule(
    pipelineIndex: number,
    name: string,
    type: ModuleType,
    description?: string
  ) {

    this._data[pipelineIndex].modules.push({
      name,
      type,
      description,
      fields: []
    });

    this._data$.next(cloneDeep(this._data));

  }

  public newField(
    pipelineIndex: number,
    moduleIndex: number,
    operation: ModuleFieldOperationType,
    target: string,
    type: ModuleFieldType,
    conditional: boolean,
    description?: string
  ) {

    this._data[pipelineIndex].modules[moduleIndex].fields.push({
      operation,
      target,
      type,
      conditional,
      description
    });

    this._data$.next(cloneDeep(this._data));

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
  conditional: boolean;
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
  Create,
  Update,
  Delete,
  Clean

}
