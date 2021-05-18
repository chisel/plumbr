import { Component, OnInit } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ModalService, ModalType } from '@plumbr/service/modal';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  public faTimes = faTimes;
  public ModalType = ModalType;
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

}
