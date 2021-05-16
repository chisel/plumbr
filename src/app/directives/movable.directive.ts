import { Directive, OnInit, ElementRef, HostListener, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appMovable]'
})
export class MovableDirective implements OnInit, OnChanges {

  public static _currentlyMoving: ElementRef<HTMLElement> = null;

  private _computedLeft: number;
  private _computedTop: number;
  private _moving: boolean = false;
  private _mouseLeft: boolean = false;
  private _lastScreenX: number = NaN;
  private _lastScreenY: number = NaN;
  private _initialZIndex: number = NaN;

  @Input('appMovable')
  public movable: boolean;

  @Output('onmovementstart')
  public onMovementStart = new EventEmitter<void>();

  @Output('onmovementend')
  public onMovementEnd = new EventEmitter<void>();

  constructor(
    private _ref: ElementRef<HTMLElement>
  ) { }

  ngOnInit() {

    // Read the initial left and top values
    this._computedLeft = +this._ref.nativeElement.style.left.substr(0, this._ref.nativeElement.style.left.length - 2);
    this._computedTop = +this._ref.nativeElement.style.top.substr(0, this._ref.nativeElement.style.top.length - 2);

    // Read the initial z-index
    this._initialZIndex = +this._ref.nativeElement.style.zIndex;

    // Attach event listener to parent for handling fast movements
    if ( this._ref.nativeElement.parentElement !== null ) {

      this._ref.nativeElement.parentElement.addEventListener('mousemove', event => {

        // If mouse left the movable element while moving
        if (
          this._moving &&
          this._mouseLeft &&
          ! isNaN(this._lastScreenX) &&
          ! isNaN(this._lastScreenY)
        ) {

          // Catch up
          // Calculate computed values
          this._computedLeft = Math.max(this._computedLeft + (event.screenX - this._lastScreenX), 0);
          this._computedTop = Math.max(this._computedTop + (event.screenY - this._lastScreenY), 0);

          // Move the element in grids of 15px
          this._ref.nativeElement.style.left = (Math.floor(this._computedLeft / 15) * 15) + 'px';
          this._ref.nativeElement.style.top = (Math.floor(this._computedTop / 15) * 15) + 'px';

          this._lastScreenX = event.screenX;
          this._lastScreenY = event.screenY;

        }

      });

    }

  }

  ngOnChanges(changes: SimpleChanges) {

    // If change is not related to appMovable value, ignore
    if ( ! changes.movable ) return;

    // Update CSS properties
    this._ref.nativeElement.style.cursor = this.movable ? 'grab' + (this._moving ? 'bing' : '') : 'default';
    this._ref.nativeElement.style.pointerEvents = this.movable ? 'all' : 'none';

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

    this.onMovementStart.next();

  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {

    // Ignore if fired by two overlapping movable elements
    if ( MovableDirective._currentlyMoving && this._ref !== MovableDirective._currentlyMoving ) return;

    if ( ! this.movable || event.buttons !== 0 ) return;

    this._moving = false;
    this._mouseLeft = false;
    this._lastScreenX = NaN;
    this._lastScreenY = NaN;
    this._ref.nativeElement.style.cursor = 'grab';
    this._ref.nativeElement.style.zIndex = this._initialZIndex + '';
    event.preventDefault();
    event.stopPropagation();

    MovableDirective._currentlyMoving = null;

    this.onMovementEnd.next();

  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {

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
    this._lastScreenX = event.screenX;
    this._lastScreenY = event.screenY;
    event.preventDefault();
    event.stopImmediatePropagation();

    // Calculate computed values
    this._computedLeft = Math.max(this._computedLeft + event.movementX, 0);
    this._computedTop = Math.max(this._computedTop + event.movementY, 0);

    // Move the element in grids of 15px
    this._ref.nativeElement.style.left = (Math.floor(this._computedLeft / 15) * 15) + 'px';
    this._ref.nativeElement.style.top = (Math.floor(this._computedTop / 15) * 15) + 'px';

  }

  @HostListener('mouseleave')
  onMouseLeave() {

    // Ignore if fired by two overlapping movable elements
    if ( MovableDirective._currentlyMoving && this._ref !== MovableDirective._currentlyMoving ) return;

    if ( this._moving ) this._mouseLeft = true;

  }

}
