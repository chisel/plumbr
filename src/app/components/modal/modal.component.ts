import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ModalService, ModalType } from '@plumbr/service/modal';
import { ModuleType } from '@plumbr/service/state';

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

    // Convert select value to number
    if ( this.currentModal === ModalType.NewModule )
      form.value.type = parseInt(form.value.type);

    this._modal.closeModal(form.value);

  }

}
