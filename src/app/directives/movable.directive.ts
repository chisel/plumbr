import { Directive, ElementRef, HostListener, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appMovable]'
})
export class MovableDirective implements OnChanges {

  private _computedLeft: number;
  private _computedTop: number;
  private _moving: boolean = false;

  @Input('appMovable')
  public movable: boolean;

  @Output('onmovementstart')
  public onMovementStart = new EventEmitter<void>();

  @Output('onmovementend')
  public onMovementEnd = new EventEmitter<void>();

  constructor(
    private _ref: ElementRef<HTMLElement>
  ) {

    // Read the initial left and top values
    this._computedLeft = +_ref.nativeElement.style.left.substr(0, _ref.nativeElement.style.left.length - 2);
    this._computedTop = +_ref.nativeElement.style.top.substr(0, _ref.nativeElement.style.top.length - 2);

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

    if ( ! this.movable || event.buttons !== 1 ) return;

    this._moving = true;
    this._ref.nativeElement.style.cursor = 'grabbing';
    event.preventDefault();

    this.onMovementStart.next();

  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {

    if ( ! this.movable || event.buttons !== 0 ) return;

    this._moving = false;
    this._ref.nativeElement.style.cursor = 'grab';
    event.preventDefault();

    this.onMovementEnd.next();

  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {

    if ( ! this.movable ) return;

    // Ignore if left click button is not held
    if ( event.buttons !== 1 ) {

      this._moving = false;
      return;

    }

    this._moving = true;
    event.preventDefault();

    // Calculate computed values
    this._computedLeft = Math.max(this._computedLeft + event.movementX, 0);
    this._computedTop = Math.max(this._computedTop + event.movementY, 0);

    // Move the element in grids of 15px
    this._ref.nativeElement.style.left = (Math.floor(this._computedLeft / 15) * 15) + 'px';
    this._ref.nativeElement.style.top = (Math.floor(this._computedTop / 15) * 15) + 'px';

  }

}
