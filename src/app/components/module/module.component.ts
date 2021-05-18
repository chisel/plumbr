import { Component, OnInit, Input } from '@angular/core';
import { ModuleData } from '@plumbr/service/state';

@Component({
  selector: 'app-module',
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.scss']
})
export class ModuleComponent implements OnInit {

  @Input('moduleData')
  public data: ModuleData;

  constructor() { }

  ngOnInit(): void {
  }

}
