import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ModalService, ModalType } from '@plumbr/service/modal';
import {
  ModuleType,
  ModuleFieldOperationType,
  ModuleFieldType,
  PipelineData,
  ModuleData,
  ModuleFieldData
} from '@plumbr/service/state';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  public faTimes = faTimes;
  public ModalType = ModalType;
  public ModuleTypeValues = Object.values(ModuleType).slice(0, Object.values(ModuleType).length / 2);
  public ModuleTypeKeys = Object.keys(ModuleType).slice(0, Object.keys(ModuleType).length / 2);
  public ModuleFieldTypeValues = Object.values(ModuleFieldType).slice(0, Object.values(ModuleFieldType).length / 2);
  public ModuleFieldTypeKeys = Object.keys(ModuleFieldType).slice(0, Object.keys(ModuleFieldType).length / 2);
  public ModuleFieldOperationTypeValues = Object.values(ModuleFieldOperationType).slice(0, Object.values(ModuleFieldOperationType).length / 2);
  public ModuleFieldOperationTypeKeys = Object.keys(ModuleFieldOperationType).slice(0, Object.keys(ModuleFieldOperationType).length / 2);
  public currentModal: ModalType = null;
  public showModal: boolean = false;

  constructor(
    private _modal: ModalService
  ) { }

  ngOnInit(): void {

    this._modal.onModalOpen$(type => {

      this.currentModal = type;
      this.showModal = true;

    });

    this._modal.onModalClosed$(() => {

      this.showModal = false;

      // Wait for the modal animation to end
      setTimeout(() => { this.currentModal = null; }, 250);

    });

  }

  public onClose() {

    this._modal.closeModal();

  }

  public onFormSubmit(form: NgForm) {

    if ( form.invalid ) return;

    // Cast values to correct type
    if ( this.currentModal === ModalType.NewModule ) {

      form.value.type = parseInt(form.value.type);

    }
    else if ( this.currentModal === ModalType.NewModuleField ) {

      form.value.operation = parseInt(form.value.operation);
      form.value.type = parseInt(form.value.type);

      if ( form.value.conditional !== true ) delete form.value.conditional;

    }

    // Delete empty descriptions (to reduce size)
    if ( (<PipelineData|ModuleData|ModuleFieldData>form.value).description === '' )
      delete form.value.description;

    this._modal.closeModal(form.value);

  }

}
