import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public title = 'Plumber';
  public newUpdate: string;

  constructor(
    private _sw: SwUpdate
  ) { }

  ngOnInit(): void {

    this._sw.available.subscribe(event => {

      this.newUpdate = (<any>event.available.appData).version;

    });

  }

}
