import { Component, OnInit, Input } from '@angular/core';
import { NoteData } from '@plumbr/service/state';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss']
})
export class NoteComponent implements OnInit {

  @Input('noteData')
  public data: NoteData;

  constructor() { }

  ngOnInit(): void {
  }

}
