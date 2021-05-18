import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private _onModalOpen$ = new Subject<ModalType>();
  private _onModalClosed$ = new Subject<void>();
  private _currentModal: ModalType = null;

  constructor() { }

  public onModalOpen$(observer: (type: ModalType) => void) {

    return this._onModalOpen$.subscribe(observer);

  }

  public async openModal(type: ModalType): Promise<void> {

    if ( this._currentModal ) throw new Error('A modal is already open!');

    this._currentModal = type;
    this._onModalOpen$.next(type);

    // Wait for the modal to be closed
    await new Promise<void>(resolve => {

      const sub = this._onModalClosed$.subscribe(() => {

        sub.unsubscribe();
        resolve();

      });

    });

  }

  public onModalClosed$(observer: () => void) {

    return this._onModalClosed$.subscribe(observer);

  }

  public closeModal() {

    this._currentModal = null;
    this._onModalClosed$.next();

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
