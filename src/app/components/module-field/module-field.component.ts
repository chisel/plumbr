import { Component, OnInit, Input } from '@angular/core';
import { ModuleFieldData, ModuleFieldType, ModuleFieldOperationType } from '@plumbr/service/state';
import { faCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-module-field',
  templateUrl: './module-field.component.html',
  styleUrls: ['./module-field.component.scss']
})
export class ModuleFieldComponent implements OnInit {

  @Input('moduleFieldData')
  public data: ModuleFieldData;

  public ModuleFieldType = ModuleFieldType;
  public ModuleFieldOperationType = ModuleFieldOperationType;
  public faCircle = faCircle;

  constructor() { }

  ngOnInit(): void {
  }

  public interpolateVariables(text: string) {

    return text.replace(/{{(.+?)}}/g, '<span class="variable">$1</span>');

  }

}
