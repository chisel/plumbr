import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  private _canvasEnabled$ = new BehaviorSubject<boolean>(true);
  private _canvasMoveMode$ = new BehaviorSubject<boolean>(false);

  constructor() { }

  public get canvasEnabled() {

    return this._canvasEnabled$.value;

  }

  public set canvasEnabled(newValue: boolean) {

    this._canvasEnabled$.next(newValue);

    // Disable move mode if canvas is disabled
    if ( ! this._canvasEnabled$.value ) this._canvasMoveMode$.next(false);

  }

  public canvasEnabled$(observer: (enabled: boolean) => void) {

    return this._canvasEnabled$.subscribe(observer);

  }

  public get canvasMoveMode() {

    return this._canvasMoveMode$.value;

  }

  public set canvasMoveMode(newValue: boolean) {

    // Ignore changing move mode when canvas is disabled
    if ( ! this._canvasEnabled$.value ) return;

    // Ignore changing move mode when new value is the same
    if ( newValue === this._canvasMoveMode$.value ) return;

    this._canvasMoveMode$.next(newValue);

    console.log('canvasMoveMode', this._canvasMoveMode$.value);

  }

  public canvasMoveMode$(observer: (enabled: boolean) => void) {

    return this._canvasMoveMode$.subscribe(observer);

  }

}
