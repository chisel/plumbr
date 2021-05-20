import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PipelineData, StateService } from '@plumbr/service/state';
import { StackMoveEndEvent } from '@plumbr/directive/stackable';

@Component({
  selector: 'app-pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss']
})
export class PipelineComponent implements OnInit {

  @Input('pipelineData')
  public data: PipelineData;

  @Input('pipelineIndex')
  public index: number;

  @Input('pipelineStackMovable')
  public movable: boolean;

  @Output('onstackmovestart')
  public onStackMoveStartBridge = new EventEmitter<void>();

  @Output('onstackmoveend')
  public onStackMoveEndBridge = new EventEmitter<void>();

  constructor(
    private _state: StateService
  ) { }

  ngOnInit(): void { }

  public onStackMoveStart() {

    this.onStackMoveStartBridge.emit();

  }

  public onStackMoveEnd(event: StackMoveEndEvent) {

    this.onStackMoveEndBridge.emit();

    if ( ! event.changed ) return;

    this._state.updateModulePosition(this.index, event.oldIndex, event.newIndex);

  }

}
