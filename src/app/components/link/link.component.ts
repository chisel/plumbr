import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { PipelineLink } from '@plumbr/service/state';
import { ToolbarService, Point } from '@plumbr/service/toolbar';
import { Subscription } from 'rxjs';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss']
})
export class LinkComponent implements OnInit, OnDestroy {

  @Input('linkData')
  public link: PipelineLink;

  @Input('linkIndex')
  public linkIndex: number;

  @Output('onlinkclick')
  public onLinkClick = new EventEmitter<MouseEvent>();

  public faChevronRight = faChevronRight;

  public nodes: [Point, Point];
  public distance: number;
  public rotation: number;
  public leftShiftMultiplier: number;
  public topShiftMultiplier: number;
  public applyTransition: boolean = false;

  constructor(
    private _toolbar: ToolbarService
  ) { }

  private _sub: Subscription;

  private _calcRotation(): number {

    return Math.atan2(this.nodes[1].y - this.nodes[0].y, this.nodes[1].x - this.nodes[0].x);

  }

  private _updateLine() {

    const angle = this._calcRotation();
    const shift = +Math.cos(angle).toFixed(2);

    this.rotation = angle * (180 / Math.PI);
    // F-ed up line ahead!!! Need to learn math a little bit more!
    this.leftShiftMultiplier = angle > 0 ? -(Math.abs(shift) - 1) : -1;
    // This is fine though!
    this.topShiftMultiplier = -shift;

  }

  ngOnInit(): void {

    setTimeout(() => this.applyTransition = true, 10);

    const closest = this._toolbar.findClosestPoints(
      document.getElementById(`pipeline${this.link.nodes[0]}`),
      document.getElementById(`pipeline${this.link.nodes[1]}`)
    );

    this.nodes = closest.points;
    this.distance = closest.distance;

    this._updateLine();

    this._sub = this._toolbar.onLinkNodesReposition(event => {

      if ( this.linkIndex === event.index ) {

        this.nodes = event.newPoints;
        this.distance = event.distance;

        this._updateLine();

      }

    });

  }

  ngOnDestroy(): void {

    if ( this._sub && ! this._sub.closed ) this._sub.unsubscribe();

  }

  public onClick(event: MouseEvent) {

    this.onLinkClick.emit(event);

  }

}
