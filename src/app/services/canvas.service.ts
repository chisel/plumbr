import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  public static SCALE_POWER: number = .1;
  public static SCALE_MIN: number = 0.4;
  public static SCALE_MAX: number = 1.4;
  public static SCALE_DEFAULT: number = 0.9;
  public static GRID_SIZE: number = 15;

  private _canvasEnabled$ = new BehaviorSubject<boolean>(true);
  private _canvasMoveMode$ = new BehaviorSubject<boolean>(false);
  private _canvasMoving$ = new BehaviorSubject<boolean>(false);
  private _overlaysEnabled$ = new BehaviorSubject<boolean>(true);
  private _onCanvasReset$ = new Subject<void>();
  private _currentScale$ = new BehaviorSubject<number>(CanvasService.SCALE_DEFAULT);
  private _shortcutsDisabled: boolean = false;

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
    // Update overlays
    this._overlaysEnabled$.next(! newValue);

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

  }

  public canvasMoving$(observer: (enabled: boolean) => void) {

    return this._canvasMoving$.subscribe(observer);

  }

  public get overlaysEnabled() {

    return this._overlaysEnabled$.value;

  }

  public set overlaysEnabled(newValue: boolean) {

    this._overlaysEnabled$.next(newValue);

  }

  public overlaysEnabled$(observer: (enabled: boolean) => void) {

    return this._overlaysEnabled$.subscribe(observer);

  }

  public onCanvasReset$(observer: () => void) {

    return this._onCanvasReset$.subscribe(observer);

  }

  public get currentScale(): number {

    return this._currentScale$.value;

  }

  public set currentScale(newScale: number) {

    const sanitizedScale = Math.min(Math.max(CanvasService.SCALE_MIN, newScale), CanvasService.SCALE_MAX);

    if ( sanitizedScale === this._currentScale$.value ) return;

    this._currentScale$.next(sanitizedScale);

  }

  public currentScale$(observer: (scale: number) => void) {

    return this._currentScale$.subscribe(observer);

  }

  public get shortcutsDisabled(): boolean {

    return this._shortcutsDisabled;

  }

  public set shortcutsDisabled(disabled: boolean) {

    this._shortcutsDisabled = disabled;

  }

  public resetCanvasPosition() {

    this._canvasEnabled$.next(false);
    this._onCanvasReset$.next();

    const canvas = document.getElementById('canvas');

    canvas.classList.add('smooth');

    setTimeout(() => {

      canvas.classList.remove('smooth');
      this._canvasEnabled$.next(true);

    }, 250);

  }

}
