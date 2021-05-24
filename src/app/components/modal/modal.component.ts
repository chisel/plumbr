import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import { sanitize as sanitizeHTML } from 'dompurify';
import * as marked from 'marked';
import { highlightAll } from 'highlight.js';
import { ModalService, OpenModalData, ModalType } from '@plumbr/service/modal';
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
  public faMarkdown = faMarkdown;

  public ModalType = ModalType;
  public ModuleTypeValues = Object.values(ModuleType).slice(0, Object.values(ModuleType).length / 2);
  public ModuleTypeKeys = Object.keys(ModuleType).slice(0, Object.keys(ModuleType).length / 2);
  public ModuleFieldTypeValues = Object.values(ModuleFieldType).slice(0, Object.values(ModuleFieldType).length / 2);
  public ModuleFieldTypeKeys = Object.keys(ModuleFieldType).slice(0, Object.keys(ModuleFieldType).length / 2);
  public ModuleFieldOperationTypeValues = Object.values(ModuleFieldOperationType).slice(0, Object.values(ModuleFieldOperationType).length / 2);
  public ModuleFieldOperationTypeKeys = Object.keys(ModuleFieldOperationType).slice(0, Object.keys(ModuleFieldOperationType).length / 2);
  public currentModal: OpenModalData = null;
  public showModal: boolean = false;
  public markdownContent: string = '';

  constructor(
    private _http: HttpClient,
    private _modal: ModalService
  ) { }

  ngOnInit(): void {

    this._modal.onModalOpen$(data => {

      // Render Markdown
      if ( data.type === ModalType.Prompt && data.context.message ) {

        this._markdownToHTML(data.context.message)
        .then(markdown => this.markdownContent = markdown);

      }
      // Load help markdown file
      else if ( data.type === ModalType.Help ) {

        this._http.get('assets/help.md', { responseType: 'text' })
        .toPromise()
        .then(data => this._markdownToHTML(data, true))
        .then(markdown => this.markdownContent = markdown)
        .catch(console.error);

      }

      this.currentModal = data;
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

  public onConfirm() {

    this._modal.closeModal(true);

  }

  public onFormSubmit(form: NgForm) {

    if ( form.invalid ) return;

    // Cast values to correct type
    if ( this.currentModal.type === ModalType.Module ) {

      form.value.type = parseInt(form.value.type);

    }
    else if ( this.currentModal.type === ModalType.ModuleField ) {

      form.value.operation = parseInt(form.value.operation);
      form.value.type = parseInt(form.value.type);

      if ( form.value.conditional !== true ) delete form.value.conditional;

    }

    // Delete empty descriptions (to reduce size)
    if ( (<PipelineData|ModuleData|ModuleFieldData>form.value).description === '' )
      delete form.value.description;

    this._modal.closeModal(form.value);

  }

  private _markdownToHTML(markdown: string, noHighlighting?: boolean): Promise<string> {

    return new Promise(resolve => {

      const html = sanitizeHTML(marked(markdown, {
        headerIds: false
      }));

      resolve(html);

      if ( ! noHighlighting ) setTimeout(highlightAll, 100);

    });

  }

}
