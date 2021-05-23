import {
  Directive,
  Input,
  Output,
  ElementRef,
  OnInit,
  EventEmitter
} from '@angular/core';

@Directive({
  selector: '[appStackable]'
})
export class StackableDirective implements OnInit {

  @Input('appStackable')
  public stackable: boolean;

  /** What to add to a floating element's width. */
  @Input('widthAdjustment')
  public widthAdjustment: string = '0px';

  /** What to add to a floating element's height. */
  @Input('heightAdjustment')
  public heightAdjustment: string = '0px';

  /** What to add to the placeholder's width of a floating element. */
  @Input('placeholderWidthAdjustment')
  public placeholderWidthAdjustment: string = '0px';

  /** What to add to the placeholder's height of a floating element. */
  @Input('placeholderHeightAdjustment')
  public placeholderHeightAdjustment: string = '0px';

  @Input('currentScale')
  public currentScale: number = 1;

  @Input('movingZindex')
  public movingZindex: number = 2000;

  @Output('onmovestart')
  public onMoveStart = new EventEmitter<HTMLElement>();

  @Output('onmoveend')
  public onMoveEnd = new EventEmitter<StackMoveEndEvent>();

  private _currentlyMoving: HTMLElement;
  private _currentPlaceholder: HTMLElement;
  private _placeholderMoved: boolean = false;
  private _indexBefore: number = -1;
  private _indexAfter: number = -1;
  private _lastClientY: number = 0;
  private _helperElement: HTMLElement;
  private _originalStyles: Partial<CSSStyleDeclaration>;
  private _mousedownHandler: (event: MouseEvent) => void;
  private _mousemoveHandler: (event: MouseEvent) => void;
  private _mouseupHandler: (event: MouseEvent) => void;

  constructor(
    private _ref: ElementRef<HTMLElement>
  ) { }

  ngOnInit() {

    // Register event handlers for all direct children
    for ( let i = 0; i < this._ref.nativeElement.children.length; i++ ) {

      const child: HTMLElement = <any>this._ref.nativeElement.children.item(i);

      // Preserve original styles
      this._originalStyles = {
        width: child.style.width,
        height: child.style.height,
        position: child.style.position,
        margin: child.style.margin,
        top: child.style.top,
        left: child.style.left,
        zIndex: child.style.zIndex
      };

      // Drag start
      this._mousedownHandler = event => this.startMove.bind(this)(event, child);
      child.addEventListener('mousedown', this._mousedownHandler);

      // Drag end
      this._mouseupHandler = event => this.finalizeMove.bind(this)(event, child);
      child.addEventListener('mouseup', this._mouseupHandler);

      // Drag
      this._mousemoveHandler = event => this.moveElement.bind(this)(event, child);
      child.addEventListener('mousemove', this._mousemoveHandler);

    }

  }

  public startMove(event: MouseEvent, child: HTMLElement) {

    // Skip if directive disabled
    if ( ! this.stackable ) return;

    event.stopImmediatePropagation();

    // Set as currently moving
    this._currentlyMoving = child;

    // Create placeholder
    this._currentPlaceholder = document.createElement('div');

    this._currentPlaceholder.classList.add('stackable-placeholder');
    this._currentPlaceholder.style.width = window.getComputedStyle(child).width;
    this._currentPlaceholder.style.height = window.getComputedStyle(child).height;
    this._currentPlaceholder.style.margin = window.getComputedStyle(child).margin;

    // Create an element to capture mousemove outside of the target element
    this._helperElement = document.createElement('div');
    this._helperElement.style.width = '100vw';
    this._helperElement.style.height = '100vh';
    this._helperElement.style.position = 'absolute';
    this._helperElement.style.backgroundColor = 'transparent';
    this._helperElement.style.cursor = 'grabbing';
    this._helperElement.style.zIndex = this.movingZindex + ' !important';
    this._helperElement.onmouseup = event => this.finalizeMove.bind(this)(event, child);
    this._helperElement.onmousemove = event => this.moveElement.bind(this)(event, child);

    // Adjust styles
    child.style.width = `calc(${window.getComputedStyle(child).width} + ${this.widthAdjustment})`;
    child.style.height = `calc(${window.getComputedStyle(child).height} + ${this.heightAdjustment})`;
    child.style.left = child.offsetLeft + 'px';
    child.style.top = child.offsetTop + 'px';
    child.style.margin = '0';
    child.style.position = 'absolute';
    child.style.zIndex = (this.movingZindex + 1) + ' !important';

    // Add classes
    child.classList.add('stackable-moving-child');
    child.parentElement.classList.add('stackable-moving-parent');

    // Add placeholder
    child.parentElement.insertBefore(this._currentPlaceholder, child);

    // Add helper element
    document.body.append(this._helperElement);

    // Emit event
    this.onMoveStart.emit(child);

  }

  public moveElement(event: MouseEvent, child: HTMLElement) {

    const lastY = this._lastClientY;
    this._lastClientY = event.clientY;

    // Skip if directive disabled
    if ( ! this.stackable ) return;

    // Skip if not currently moving
    if ( this._currentlyMoving !== child ) return;

    event.stopImmediatePropagation();

    // Move element on Y-axis
    child.style.top = (+child.style.top.replace('px', '') + ((event.clientY - lastY) / this.currentScale)) + 'px';

    // Check if center point has crossed any other siblings
    let children: ChildPosition[] = [];

    // Build a mapping from all children of parent (including currently moving)
    for ( let j = 0; j < child.parentElement.children.length; j++ ) {

      const ref: HTMLElement = <any>child.parentElement.children.item(j);

      // Skip if looking at placeholder
      if ( ref === this._currentPlaceholder ) continue;

      children.push({
        point: ((ref.offsetHeight + +window.getComputedStyle(ref).marginTop.replace('px', '') + +window.getComputedStyle(ref).marginBottom.replace('px', '')) / 2) + ref.offsetTop,
        ref
      });

    }

    // Store currently moving child's index
    const indexBeforeSort = children.findIndex(value => value.ref === child);

    // Sort by center points
    children = children.sort((a, b) => a.point - b.point);

    // Find index of currently moving child after sort
    const indexAfterSort = children.findIndex(value => value.ref === child);

    // If child has not been moved enough to change the order, ignore
    if ( indexBeforeSort === indexAfterSort ) {

      // If placeholder was moved before, restore it to its original state
      if ( this._placeholderMoved ) {

        child.parentElement.removeChild(this._currentPlaceholder);
        child.parentElement.insertBefore(this._currentPlaceholder, child);

        this._placeholderMoved = false;
        this._indexBefore = -1;
        this._indexAfter = -1;

      }

      return;

    }

    // Otherwise, move the placeholder to the new position
    child.parentElement.removeChild(this._currentPlaceholder);

    if ( indexAfterSort === children.length - 1 )
      child.parentElement.appendChild(this._currentPlaceholder);
    else
      child.parentElement.insertBefore(this._currentPlaceholder, children[indexAfterSort + 1].ref);

    // Mark placeholder as moved
    this._placeholderMoved = true;

    // Set indices
    this._indexBefore = indexBeforeSort;
    this._indexAfter = indexAfterSort;

  }

  public finalizeMove(event: MouseEvent, child: HTMLElement) {

    // Skip if directive disabled
    if ( ! this.stackable && ! this._currentlyMoving ) return;

    event.stopImmediatePropagation();

    // Skip if not currently moving
    if ( this._currentlyMoving !== child ) return;

    // Restore styles
    child.style.width = this._originalStyles.width;
    child.style.height = this._originalStyles.height;
    child.style.left = this._originalStyles.left;
    child.style.top = this._originalStyles.top;
    child.style.margin = this._originalStyles.margin;
    child.style.position = this._originalStyles.position;
    child.style.zIndex = this._originalStyles.zIndex;

    // Remove classes
    child.classList.remove('stackable-moving-child');
    child.parentElement.classList.remove('stackable-moving-parent');

    // Remove placeholder
    child.parentElement.removeChild(this._currentPlaceholder);

    // Remove helper element
    document.body.removeChild(this._helperElement);

    // Remove currently moving ref
    // this._currentlyMoving = null;

    // Emit event
    this.onMoveEnd.emit({
      changed: this._placeholderMoved,
      oldIndex: this._indexBefore,
      newIndex: this._indexAfter
    });

    // Reset placeholder flag and indices
    this._placeholderMoved = false;
    this._indexBefore = -1;
    this._indexAfter = -1;

  }

}

interface ChildPosition {
  point: number;
  ref: HTMLElement;
}

export interface StackMoveEndEvent {
  changed: boolean;
  oldIndex: number;
  newIndex: number;
}
