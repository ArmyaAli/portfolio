import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';
import { Component } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})

export class ToolbarComponent {
  showHomeToggle = false;
  MenuComponentRef: MatBottomSheetRef | null = null;
  constructor(private _bottomSheet: MatBottomSheet, public router: Router, public sharedState: sharedMenuState) {
  }

  openBottomSheet(): void {
    if(!this.router.url.match(/\/home/)) this.sharedState.showHome = true;
    this.MenuComponentRef = this._bottomSheet.open(MenuComponent);
  }
}

@Component({
  selector: 'bottom-sheet',
  templateUrl: './menu.html',
})
export class MenuComponent {
  constructor(private _bottomSheetRef: MatBottomSheetRef<MenuComponent>, public router: Router, public sharedState: sharedMenuState) {
    this._bottomSheetRef.afterDismissed().subscribe(_ => {
      if (this.router.url.match(/\/home/)) { this.sharedState.showHome = false; }
      else { this.sharedState.showHome = true; }
    })
  }

  openLink(event: MouseEvent, route: string): void {
    this._bottomSheetRef.dismiss();
    this.router.navigate([route]);
    event.preventDefault();
  }
}

@Injectable()
export class sharedMenuState {
  showHome = false;
  constructor() {
  }
}