import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private _onModalOpen$ = new Subject<ModalType>();
  private _onModalClosed$ = new Subject<any>();
  private _currentModal: ModalType = null;

  constructor() { }

  public onModalOpen$(observer: (type: ModalType) => void) {

    return this._onModalOpen$.subscribe(observer);

  }

  public async openModal(type: ModalType): Promise<any> {

    if ( this._currentModal !== null ) throw new Error('A modal is already open!');

    this._currentModal = type;
    this._onModalOpen$.next(type);

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

  NewPipeline,
  NewModule,
  NewModuleField,
  Help

}
