import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  private _canvasEnabled$ = new BehaviorSubject<boolean>(true);
  private _canvasMoveMode$ = new BehaviorSubject<boolean>(false);
  private _canvasMoving$ = new BehaviorSubject<boolean>(false);
  private _headerEnabled$ = new BehaviorSubject<boolean>(true);

  constructor() { }

  public get canvasEnabled() {

    return this._canvasEnabled$.value;

  }

  public set canvasEnabled(newValue: boolean) {

    this._canvasEnabled$.next(newValue);

    // Disable move mode if canvas is disabled
    if ( ! this._canvasEnabled$.value ) {

      this._canvasMoveMode$.next(false);
      this._canvasMoving$.next(false);

    }

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

    // Turn canvasMoving off when value is false
    if ( ! newValue ) this._canvasMoving$.next(false);

    console.log('canvasMoveMode', this._canvasMoveMode$.value);

  }

  public canvasMoveMode$(observer: (enabled: boolean) => void) {

    return this._canvasMoveMode$.subscribe(observer);

  }

  public get canvasMoving() {

    return this._canvasMoving$.value;

  }

  public set canvasMoving(newValue: boolean) {

    // Ignore changing move mode when canvas is disabled
    if ( ! this._canvasEnabled$.value ) return;

    // Ignore changing move mode when new value is the same
    if ( newValue === this._canvasMoving$.value ) return;

    this._canvasMoving$.next(newValue);
    // Also update header
    this._headerEnabled$.next(! newValue);

  }

  public canvasMoving$(observer: (enabled: boolean) => void) {

    return this._canvasMoving$.subscribe(observer);

  }

  public get headerEnabled() {

    return this._headerEnabled$.value;

  }

  public set headerEnabled(newValue: boolean) {

    this._headerEnabled$.next(newValue);

  }

  public headerEnabled$(observer: (enabled: boolean) => void) {

    return this._headerEnabled$.subscribe(observer);

  }

}
