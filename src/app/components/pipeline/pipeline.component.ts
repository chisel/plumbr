import { Component, OnInit, Input } from '@angular/core';
import { PipelineData } from '@plumbr/service/state';

@Component({
  selector: 'app-pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss']
})
export class PipelineComponent implements OnInit {

  @Input('pipelineData')
  public data: PipelineData;

  constructor() { }

  ngOnInit(): void { }

}
