import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModuleData, StateService } from '@plumbr/service/state';
import { StackMoveEndEvent } from '@plumbr/directive/stackable';

@Component({
  selector: 'app-module',
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.scss']
})
export class ModuleComponent implements OnInit {

  @Input('moduleData')
  public data: ModuleData;

  @Input('pipelineIndex')
  public pipelineIndex: number;

  @Input('moduleIndex')
  public index: number;

  @Input('moduleStackMovable')
  public movable: boolean;

  @Output('onstackmovestart')
  public onStackMoveStartBridge = new EventEmitter<void>();

  @Output('onstackmoveend')
  public onStackMoveEndBridge = new EventEmitter<void>();

  constructor(
    private _state: StateService
  ) { }

  ngOnInit(): void {
  }

  public onStackMoveStart() {

    this.onStackMoveStartBridge.emit();

  }

  public onStackMoveEnd(event: StackMoveEndEvent) {

    this.onStackMoveEndBridge.emit();

    if ( ! event.changed ) return;

    this._state.updateFieldPosition(this.pipelineIndex, this.index, event.oldIndex, event.newIndex);

  }

  public onStackRefresh() {

    this._state.refreshState();

  }

}
