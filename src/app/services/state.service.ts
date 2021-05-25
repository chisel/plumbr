import { Injectable, EventEmitter } from '@angular/core';
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
  private _links: PipelineLink[] = [];
  private _links$ = new BehaviorSubject<PipelineLink[]>([]);
  private _notes: NoteData[] = [];
  private _notes$ = new BehaviorSubject<NoteData[]>([]);
  private _history: HistoryState[] = [];
  /** Flag for export only and not localstorage. */
  private _unsavedChanges: boolean = false;
  private _onLinksPositionOutdated = new EventEmitter<number>();

  constructor(
    private _modal: ModalService
  ) {

    // Load data from localstorage
    const stored = localStorage.getItem(StateService.LOCALSTORAGE_KEY);

    if ( ! stored ) return;

    const state: HistoryState = JSON.parse(decompress(stored));

    this._data = state.data;
    this._data$.next(cloneDeep(this._data));
    this._links = state.links;
    this._links$.next(cloneDeep(this._links));
    this._notes = state.notes;
    this._notes$.next(cloneDeep(this._notes));

    console.log('State loaded from localstorage');

  }

  private _updateData(newValue: PipelineData[], skipHistory?: boolean, skipSave?: boolean) {

    this._unsavedChanges = true;

    // Add the current state to history
    if ( ! skipHistory ) this.captureHistory();
    // Set the data with the new value
    this._data = newValue;
    // Emit the data change to all subscribers
    this._data$.next(cloneDeep(this._data));

    if ( ! skipSave ) this.saveDataToLocalstorage();

  }

  private _updateLinks(newValue: PipelineLink[], skipHistory?: boolean, skipSave?: boolean) {

    this._unsavedChanges = true;

    // Add the current state to history
    if ( ! skipHistory ) this.captureHistory();
    // Set the data with the new value
    this._links = newValue;
    // Emit the data change to all subscribers
    this._links$.next(cloneDeep(this._links));

    if ( ! skipSave ) this.saveDataToLocalstorage();

  }

  private _updateNotes(newValue: NoteData[], skipHistory?: boolean, skipSave?: boolean) {

    this._unsavedChanges = true;

    // Add the current state to history
    if ( ! skipHistory ) this.captureHistory();
    // Set the data with the new value
    this._notes = newValue;
    // Emit the data change to all subscribers
    this._notes$.next(cloneDeep(this._notes));

    if ( ! skipSave ) this.saveDataToLocalstorage();

  }

  public captureHistory() {

    this._history.push({
      data: cloneDeep(this._data),
      links: cloneDeep(this._links),
      notes: cloneDeep(this._notes)
    });

    // Only keep the last 15 moves
    if ( this._history.length > 15 )
      this._history = this._history.slice(-15);

  }

  public saveDataToLocalstorage() {

    // Saved the compressed version of the current state to localstorage
    const uncompressed = JSON.stringify({
      data: this._data,
      links: this._links,
      notes: this._notes
    });
    const compressed = compress(uncompressed);

    // Disable auto-save when compressed data is above 5mb in size
    if ( ((compressed.length * 2) / (1024 * 1024)) > 5 ) {

      console.log('Auto-save disabled because compressed size is above 5MB!');

      localStorage.removeItem(StateService.LOCALSTORAGE_KEY);
      return;

    }

    localStorage.setItem(StateService.LOCALSTORAGE_KEY, compressed);

    console.log(`Saved state (original ${((uncompressed.length * 2) / 1024).toFixed(2)}kb | compressed ${((compressed.length * 2) / 1024).toFixed(2)}kb)`);

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

  public updatePipelinePosition(index: number, left: number, top: number, skipHistory?: boolean, skipSave?: boolean) {

    let newValue = this.data;

    newValue[index].position = { left, top };

    this._updateData(newValue, skipHistory, skipSave);

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

    // Update links positions
    this._onLinksPositionOutdated.emit(pipelineIndex);

    return this._data[pipelineIndex].modules.length - 1;

  }

  public updateModulePosition(pipelineIndex: number, oldIndex: number, newIndex: number, skipHistory?: boolean, skipSave?: boolean) {

    let newValue = this.data;

    const old = newValue[pipelineIndex].modules.splice(oldIndex, 1)[0];
    newValue[pipelineIndex].modules.splice(newIndex, 0, old);

    this._updateData(newValue, skipHistory, skipSave);

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

    // Update links positions
    this._onLinksPositionOutdated.emit(pipelineIndex);

    return this._data[pipelineIndex].modules[moduleIndex].fields.length - 1;

  }

  public updateFieldPosition(pipelineIndex: number, moduleIndex: number, oldIndex: number, newIndex: number, skipHistory?: boolean, skipSave?: boolean) {

    let newValue = this.data;

    const old = newValue[pipelineIndex].modules[moduleIndex].fields.splice(oldIndex, 1)[0];
    newValue[pipelineIndex].modules[moduleIndex].fields.splice(newIndex, 0, old);

    this._updateData(newValue, skipHistory, skipSave);

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

    const newData = this.data;
    let newLinks = this.links;
    const originalLinksSize = newLinks.length;

    newData.splice(index, 1);

    // Delete links to this pipeline
    for ( let i = 0; i < newLinks.length; i++ ) {

      if ( newLinks[i].nodes[0] === index || newLinks[i].nodes[1] === index ) {

        newLinks.splice(i, 1);
        i--;

      }

    }

    // Shift links indices
    newLinks = newLinks.map(link => {

      if ( index < link.nodes[0] ) link.nodes[0]--;
      if ( index < link.nodes[1] ) link.nodes[1]--;

      return link;

    });

    this.captureHistory();
    this._updateData(newData, true, true);
    if ( originalLinksSize !== newLinks.length ) this._updateLinks(newLinks, true, true);
    this.saveDataToLocalstorage();

  }

  public bulkDeletePipeline(indices: { pipelineIndex: number }[]) {

    const newData = this.data;
    let newLinks = this.links;
    const originalLinksSize = newLinks.length;
    const deletedPipelines: number[] = [];

    for ( let i = 0; i < indices.length; i++ ) {

      const { pipelineIndex: index } = indices[i];
      // Calculate the index shift based on previously deleted items within the same container
      const shift = indices
      .slice(0, i)
      .filter(indice => indice.pipelineIndex < index)
      .length;

      newData.splice(index - shift, 1);
      deletedPipelines.push(index);

    }

    // Delete links to the deleted pipelines
    for ( let i = 0; i < newLinks.length; i++ ) {

      if ( deletedPipelines.includes(newLinks[i].nodes[0]) || deletedPipelines.includes(newLinks[i].nodes[1]) ) {

        newLinks.splice(i, 1);
        i--;

      }

    }

    // Shift links indices
    newLinks = newLinks.map(link => {

      link.nodes[0] -= deletedPipelines.filter(index => index < link.nodes[0]).length;
      link.nodes[1] -= deletedPipelines.filter(index => index < link.nodes[1]).length;

      return link;

    });

    this.captureHistory();
    this._updateData(newData, true, true);
    if ( originalLinksSize !== newLinks.length ) this._updateLinks(newLinks, true, true);
    this.saveDataToLocalstorage();

  }

  public deleteModule(index: number, mindex: number) {

    const newValue = this.data;

    newValue[index].modules.splice(mindex, 1);

    this._updateData(newValue);

    // Update links positions
    this._onLinksPositionOutdated.emit(index);

  }

  public bulkDeleteModule(indices: { pipelineIndex: number, moduleIndex: number }[]) {

    const newValue = this.data;
    const pipelinesAffected: number[] = [];

    for ( let i = 0; i < indices.length; i++ ) {

      const { pipelineIndex: index, moduleIndex: mindex } = indices[i];
      // Calculate the index shift based on previously deleted items within the same container
      const shift = indices
      .slice(0, i)
      .filter(indice => indice.pipelineIndex === index && indice.moduleIndex < mindex)
      .length;

      newValue[index].modules.splice(mindex - shift, 1);
      pipelinesAffected.push(index);

    }

    this._updateData(newValue);

    // Update links positions
    for ( let i = 0; i < pipelinesAffected.length; i++ ) {

      this._onLinksPositionOutdated.emit(pipelinesAffected[i]);

    }

  }

  public deleteModuleField(index: number, mindex: number, findex: number) {

    const newValue = this.data;

    newValue[index].modules[mindex].fields.splice(findex, 1);

    this._updateData(newValue);

    // Update links positions
    this._onLinksPositionOutdated.emit(index);

  }

  public bulkDeleteModuleField(indices: { pipelineIndex: number, moduleIndex: number, fieldIndex: number }[]) {

    const newValue = this.data;
    const pipelinesAffected: number[] = [];

    for ( let i = 0; i < indices.length; i++ ) {

      const { pipelineIndex: index, moduleIndex: mindex, fieldIndex: findex } = indices[i];
      // Calculate the index shift based on previously deleted items within the same container
      const shift = indices
      .slice(0, i)
      .filter(indice => indice.pipelineIndex === index && indice.moduleIndex === mindex && indice.fieldIndex < findex)
      .length;

      newValue[index].modules[mindex].fields.splice(findex - shift, 1);
      pipelinesAffected.push(index);

    }

    this._updateData(newValue);

    // Update links positions
    for ( let i = 0; i < pipelinesAffected.length; i++ ) {

      this._onLinksPositionOutdated.emit(pipelinesAffected[i]);

    }

  }

  public undo(skipSave?: boolean) {

    if ( ! this._history.length ) return;

    const newValue = this._history.pop();

    this._updateData(newValue.data, true, true);
    this._updateLinks(newValue.links, true, true);
    this._updateNotes(newValue.notes, true, true);
    if ( ! skipSave ) this.saveDataToLocalstorage();

    // Reposition all pipeline links
    const count = this._data.length;

    for ( let i = 0; i < count; i++ ) {

      this._onLinksPositionOutdated.emit(i);

    }

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
    input.setAttribute('accept', '.flow');
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
        const loadedData: HistoryState = JSON.parse(loadedRawData);

        // Invalid data
        if ( loadedData === null ) throw new Error('Invalid import data!');

        // Load the data in app (skip setting history)
        this._updateData(loadedData.data, true, true);
        this._updateLinks(loadedData.links, true, true);
        this._updateNotes(loadedData.notes, true, true);

        // Reset history
        this._history = [];
        this._unsavedChanges = false;

        // Save data into localstorage
        this.saveDataToLocalstorage();

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
      JSON.stringify({
        data: this.data,
        links: this.links,
        notes: this.notes
      })
    ], {
      type: 'text/plain;charset=utf-8'
    });

    saveFile(blob, 'plumbr.flow');

    this._unsavedChanges = false;

  }

  public refreshState() {

    this._data$.next(this.data);
    this._links$.next(this.links);
    this._notes$.next(this.notes);

  }

  public get links() {

    return cloneDeep(this._links);

  }

  public links$(observer: (links: PipelineLink[]) => void) {

    return this._links$.subscribe(observer);

  }

  public createLink(
    index1: number,
    index2: number,
    skipHistory?: boolean,
    skipSave?: boolean
  ): number {

    const newValue = cloneDeep(this._links);

    newValue.push({
      color: Color.Default,
      nodes: [ index1, index2 ]
    });

    this._updateLinks(newValue, skipHistory, skipSave);

    return this._links.length - 1;

  }

  public deleteLink(
    index: number,
    skipHistory?: boolean,
    skipSave?: boolean
  ) {

    const newValue = cloneDeep(this._links);

    newValue.splice(index, 1);

    this._updateLinks(newValue, skipHistory, skipSave);

  }

  public updateLinkColor(index: number, color: Color, skipHistory?: boolean, skipSave?: boolean) {

    const newValue = this.links;

    newValue[index].color = color;

    this._updateLinks(newValue, skipHistory, skipSave);

  }

  public onLinksPositionOutdated(observer: (pipelineIndex: number) => void) {

    return this._onLinksPositionOutdated.subscribe(observer);

  }

  public get notes() {

    return cloneDeep(this._notes);

  }

  public notes$(observer: (notes: NoteData[]) => void) {

    return this._notes$.subscribe(observer);

  }

  public newNote(name: string, description: string, left: number, top: number, skipHistory?: boolean, skipSave?: boolean): number {

    const newValue = this.notes;

    newValue.push({
      name,
      description,
      color: Color.Default,
      position: {
        left,
        top
      }
    });

    this._updateNotes(newValue, skipHistory, skipSave);

    return this._notes.length - 1;

  }

  public updateNote(index: number, name: string, description: string, skipHistory?: boolean, skipSave?: boolean) {

    const newValue = this.notes;

    newValue[index].name = name;
    newValue[index].description = description;

    this._updateNotes(newValue, skipHistory, skipSave);

  }

  public updateNoteColor(index: number, color: Color, skipHistory?: boolean, skipSave?: boolean) {

    const newValue = this.notes;

    newValue[index].color = color;

    this._updateNotes(newValue, skipHistory, skipSave);

  }

  public updateNotePosition(index: number, left: number, top: number, skipHistory?: boolean, skipSave?: boolean) {

    const newValue = this.notes;

    newValue[index].position = { left, top };

    this._updateNotes(newValue, skipHistory, skipSave);

  }

  public deleteNote(index: number, skipHistory?: boolean, skipSave?: boolean) {

    const newValue = this.notes;

    newValue.splice(index, 1);

    this._updateNotes(newValue, skipHistory, skipSave);

  }

  public bulkDeleteNote(indices: { noteIndex: number }[]) {

    const newNotes = this.notes;
    const deletedNotes: number[] = [];

    for ( let i = 0; i < indices.length; i++ ) {

      const { noteIndex: index } = indices[i];
      // Calculate the index shift based on previously deleted items within the same container
      const shift = indices
      .slice(0, i)
      .filter(indice => indice.noteIndex < index)
      .length;

      newNotes.splice(index - shift, 1);
      deletedNotes.push(index);

    }

    this.captureHistory();
    this._updateNotes(newNotes, true, true);
    this.saveDataToLocalstorage();

  }

}

export interface PipelineData {

  name: string;
  description?: string;
  modules: ModuleData[];
  position: Position;

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

export interface HistoryState {

  data: PipelineData[];
  links: PipelineLink[];
  notes: NoteData[];

}

export interface PipelineLink {

  nodes: [number, number];
  color: Color;

}

export enum Color {

  Blue,
  Green,
  Orange,
  Red,
  Purple,
  Default = Color.Blue

}

export interface NoteData {

  name: string;
  description: string;
  color: Color;
  position: Position;

}

export interface Position {

  left: number;
  top: number;

}
