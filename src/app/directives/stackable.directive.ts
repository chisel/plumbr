import { Directive, Input, Output, ElementRef, OnInit, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appStackable]'
})
export class StackableDirective implements OnInit, OnChanges {

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

  @Output('onmovestart')
  public onMoveStart = new EventEmitter<HTMLElement>();

  @Output('onmoveend')
  public onMoveEnd = new EventEmitter<StackMoveEndEvent>();

  @Output('onrefresh')
  public onRefresh = new EventEmitter<void>();

  private _currentlyMoving: HTMLElement;
  private _currentPlaceholder: HTMLElement;
  private _placeholderMoved: boolean = false;
  private _indexBefore: number = -1;
  private _indexAfter: number = -1;

  constructor(
    private _ref: ElementRef<HTMLElement>
  ) { }

  ngOnChanges(changes: SimpleChanges) {

    // If change is not related to appStackable value, ignore
    if ( ! changes.stackable ) return;

    // Refresh everything
    if ( ! this.stackable && changes.stackable.previousValue && this._currentlyMoving ) {

      this.onRefresh.emit();

    }

  }

  ngOnInit() {

    // Register event handlers for all direct children
    for ( let i = 0; i < this._ref.nativeElement.children.length; i++ ) {

      const child: HTMLElement = <any>this._ref.nativeElement.children.item(i);

      // Preserve original styles
      const original = {
        width: child.style.width,
        height: child.style.height,
        position: child.style.position,
        margin: child.style.margin,
        top: child.style.top,
        left: child.style.left
      };

      // Drag start
      child.addEventListener('mousedown', event => {

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

        // Adjust styles
        child.style.width = `calc(${window.getComputedStyle(child).width} + ${this.widthAdjustment})`;
        child.style.height = `calc(${window.getComputedStyle(child).height} + ${this.heightAdjustment})`;
        child.style.left = child.offsetLeft + 'px';
        child.style.top = child.offsetTop + 'px';
        child.style.margin = '0';
        child.style.position = 'absolute';

        // Add classes
        child.classList.add('stackable-moving-child');
        child.parentElement.classList.add('stackable-moving-parent');

        // Add placeholder
        child.parentElement.insertBefore(this._currentPlaceholder, child);

        // Emit event
        this.onMoveStart.emit(child);

      });

      // Drag end
      child.addEventListener('mouseup', event => this.finalizeMove(event, child, this._currentPlaceholder, original));
      child.addEventListener('mouseleave', event => this.finalizeMove(event, child, this._currentPlaceholder, original));

      // Drag
      child.addEventListener('mousemove', event => {

        // Skip if directive disabled
        if ( ! this.stackable ) return;

        event.stopImmediatePropagation();

        // Skip if not currently moving
        if ( this._currentlyMoving !== child ) return;

        // Move element on Y-axis
        child.style.top = (+child.style.top.replace('px', '') + event.movementY) + 'px';

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

      });

    }

  }

  public finalizeMove(event: MouseEvent, child: HTMLElement, placeholder: HTMLElement, original: any) {

    // Skip if directive disabled
    if ( ! this.stackable && ! this._currentlyMoving ) return;

    event.stopImmediatePropagation();

    // Skip if not currently moving
    if ( this._currentlyMoving !== child ) return;

    // Restore styles
    child.style.width = original.width;
    child.style.height = original.height;
    child.style.left = original.left;
    child.style.top = original.top;
    child.style.margin = original.margin;
    child.style.position = original.position;

    // Remove classes
    child.classList.remove('stackable-moving-child');
    child.parentElement.classList.remove('stackable-moving-parent');

    // Remove placeholder
    child.parentElement.removeChild(placeholder);

    // Remove currently moving ref
    this._currentlyMoving = null;

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
