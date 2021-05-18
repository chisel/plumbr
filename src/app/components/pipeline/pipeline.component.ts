import { Component, OnInit, Input } from '@angular/core';
import { StateService, PipelineData } from '@plumbr/service/state';

@Component({
  selector: 'app-pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss']
})
export class PipelineComponent implements OnInit {

  @Input('pipelineData')
  public data: PipelineData;

  constructor(
    private _state: StateService
  ) { }

  ngOnInit(): void { }

  public onClick() {

    

  }

}
