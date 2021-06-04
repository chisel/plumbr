import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ModuleType, ModuleFieldOperationType, ModuleFieldType, ModuleDependency } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private _onModalOpen$ = new Subject<OpenModalData>();
  private _onModalClosed$ = new Subject<any>();
  private _currentModal: ModalType = null;

  constructor() { }

  public onModalOpen$(observer: (data: OpenModalData) => void) {

    return this._onModalOpen$.subscribe(observer);

  }

  public async openModal<T=any>(type: ModalType, context?: T): Promise<any> {

    if ( this._currentModal !== null ) throw new Error('A modal is already open!');

    this._currentModal = type;
    this._onModalOpen$.next({ type, context });

    // Wait for the modal to be closed
    return new Promise<any>(resolve => {

      const sub = this._onModalClosed$.subscribe((data: any) => {

        sub.unsubscribe();
        resolve(data);

      });

    });

  }

  public onModalClosed$(observer: (data?: any) => void) {

    return this._onModalClosed$.subscribe(observer);

  }

  public closeModal(data?: any) {

    this._currentModal = null;
    this._onModalClosed$.next(data);

  }

  public get currentModal() {

    return this._currentModal;

  }

}

export enum ModalType {

  Pipeline,
  Module,
  ModuleField,
  Note,
  Link,
  Confirmation,
  Prompt,
  Help,
  Spinner

}

export interface OpenModalData {

  type: ModalType;
  context?: any;

}

export interface MessageContext {

  title: string;
  message: string;

}

export interface PipelineContext {

  name: string;
  description?: string;

}

export interface ModuleContext {

  name: string;
  type: ModuleType | '';
  description?: string;
  dependencies?: ModuleDependency[];

}

export interface ModuleFieldContext {

  operation: ModuleFieldOperationType | '';
  target: string;
  type: ModuleFieldType | '';
  conditional?: true;
  description?: string;

}

export interface NoteContext {

  name: string;
  description: string;

}

export interface LinkContext {

  name: string;

}
