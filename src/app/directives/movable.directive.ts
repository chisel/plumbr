import {
  Directive,
  OnInit,
  ElementRef,
  HostListener,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Directive({
  selector: '[appMovable]'
})
export class MovableDirective implements OnInit, OnChanges {

  public static _currentlyMoving: ElementRef<HTMLElement> = null;
  public static GRID_SIZE: number = 15;

  private _computedLeft: number;
  private _computedTop: number;
  private _moving: boolean = false;
  private _mouseLeft: boolean = false;
  private _lastClientX: number = NaN;
  private _lastClientY: number = NaN;
  private _initialZIndex: number = NaN;
  private _parentHandler: (event: MouseEvent) => void;

  @Input('appMovable')
  public movable: boolean;

  @Input('currentScale')
  public currentScale: number = 1;

  @Output('onmovementstart')
  public onMovementStart = new EventEmitter<HTMLElement>();

  @Output('onmovementend')
  public onMovementEnd = new EventEmitter<HTMLElement>();

  @Output('onmovement')
  public onMovement = new EventEmitter<HTMLElement>();

  private _gridify(position: number): number {

    const scaledGrid = MovableDirective.GRID_SIZE * this.currentScale;

    return Math.floor(position / scaledGrid) * scaledGrid;

  }

  constructor(
    private _ref: ElementRef<HTMLElement>
  ) { }

  ngOnInit() {

    // Read the initial left and top values
    this._computedLeft = +this._ref.nativeElement.style.left.substr(0, this._ref.nativeElement.style.left.length - 2) / this.currentScale;
    this._computedTop = +this._ref.nativeElement.style.top.substr(0, this._ref.nativeElement.style.top.length - 2) / this.currentScale;

    // Read the initial z-index
    this._initialZIndex = +this._ref.nativeElement.style.zIndex;

  }

  ngOnChanges(changes: SimpleChanges) {

    // If change is not related to appMovable value, ignore
    if ( ! changes.movable ) return;

    // Update CSS properties
    this._ref.nativeElement.style.cursor = this.movable ? 'grab' + (this._moving ? 'bing' : '') : 'default';

  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {

    // Ignore if fired by two overlapping movable elements
    if ( MovableDirective._currentlyMoving && this._ref !== MovableDirective._currentlyMoving ) return;

    if ( ! this.movable || event.buttons !== 1 ) return;

    this._moving = true;
    this._ref.nativeElement.style.cursor = 'grabbing';
    this._ref.nativeElement.style.zIndex = '99999';
    event.preventDefault();
    event.stopPropagation();

    MovableDirective._currentlyMoving = this._ref;

    // Attach event listener to parent for handling fast movements
    if ( this._ref.nativeElement.parentElement !== null ) {

      this._parentHandler = event => {

        // If mouse left the movable element while moving
        if (
          this._moving &&
          this._mouseLeft &&
          ! isNaN(this._lastClientX) &&
          ! isNaN(this._lastClientY)
        ) {

          // Catch up
          // Calculate computed values
          this._computedLeft = Math.max(this._computedLeft + ((event.clientX - this._lastClientX) / this.currentScale), 0);
          this._computedTop = Math.max(this._computedTop + ((event.clientY - this._lastClientY) / this.currentScale), 0);

          // Keep old position
          const oldLeft = this._ref.nativeElement.style.left;
          const oldTop = this._ref.nativeElement.style.top;

          // Move the element in grids of 15px
          this._ref.nativeElement.style.left = this._gridify(this._computedLeft * this.currentScale) + 'px';
          this._ref.nativeElement.style.top = this._gridify(this._computedTop * this.currentScale) + 'px';

          this._lastClientX = event.clientX;
          this._lastClientY = event.clientY;

          event.stopImmediatePropagation();
          event.preventDefault();

          // Emit onmovement if element was moved in grids
          if ( this._ref.nativeElement.style.left !== oldLeft || this._ref.nativeElement.style.top !== oldTop )
            this.onMovement.emit(this._ref.nativeElement);

        }

      };

      this._ref.nativeElement.parentElement.addEventListener('mousemove', this._parentHandler);

    }

    this.onMovementStart.next(this._ref.nativeElement);

  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {

    // Ignore if fired by two overlapping movable elements
    if ( MovableDirective._currentlyMoving && this._ref !== MovableDirective._currentlyMoving ) return;

    if ( ! this.movable || event.buttons !== 0 ) return;

    this._moving = false;
    this._mouseLeft = false;
    this._lastClientX = NaN;
    this._lastClientY = NaN;
    this._ref.nativeElement.style.cursor = 'grab';
    this._ref.nativeElement.style.zIndex = this._initialZIndex + '';
    event.preventDefault();
    event.stopPropagation();

    // Remove parent event handler
    if ( this._parentHandler ) {

      this._ref.nativeElement.parentElement.removeEventListener('mousemove', this._parentHandler);

    }

    MovableDirective._currentlyMoving = null;

    this.onMovementEnd.next(this._ref.nativeElement);

  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {

    const lastX = this._lastClientX;
    const lastY = this._lastClientY;
    this._lastClientX = event.clientX;
    this._lastClientY = event.clientY;

    // Ignore if fired by two overlapping movable elements
    if ( MovableDirective._currentlyMoving && this._ref !== MovableDirective._currentlyMoving ) return;

    if ( ! this.movable ) return;

    // Ignore if left click button is not held
    if ( event.buttons !== 1 ) {

      this._moving = false;
      return;

    }

    this._moving = true;
    this._mouseLeft = false;
    event.preventDefault();
    event.stopImmediatePropagation();

    // Calculate computed values
    this._computedLeft = Math.max(this._computedLeft + ((event.clientX - lastX) / this.currentScale), 0);
    this._computedTop = Math.max(this._computedTop + ((event.clientY - lastY) / this.currentScale), 0);

    // Keep old position
    const oldLeft = this._ref.nativeElement.style.left;
    const oldTop = this._ref.nativeElement.style.top;

    // Move the element in grids of 15px
    this._ref.nativeElement.style.left = this._gridify(this._computedLeft * this.currentScale) + 'px';
    this._ref.nativeElement.style.top = this._gridify(this._computedTop * this.currentScale) + 'px';

    // Emit onmovement if element was moved in grids
    if ( this._ref.nativeElement.style.left !== oldLeft || this._ref.nativeElement.style.top !== oldTop )
      this.onMovement.emit(this._ref.nativeElement);

  }

  @HostListener('mouseleave')
  onMouseLeave() {

    // Ignore if fired by two overlapping movable elements
    if ( MovableDirective._currentlyMoving && this._ref !== MovableDirective._currentlyMoving ) return;

    if ( this._moving ) this._mouseLeft = true;

  }

}
