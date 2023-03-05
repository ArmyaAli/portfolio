import { EventEmitter } from '@angular/core';
import { Injectable } from '@angular/core';
import { Component } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { stateService } from '../state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})

export class ToolbarComponent {
  showHomeToggle = false;
  switch = true;
  MenuComponentRef: MatBottomSheetRef | null = null;
  name = "Ali Umar"
  nameText = ""
  nameIndex = 0;
  nameInterval: any = 0;
  lastCharacterFlag = false;
  directionFlag = false;
  i = 0;
  constructor(private _bottomSheet: MatBottomSheet, public router: Router, public sharedState: sharedMenuState, private stateService: stateService, private _snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.nameInterval = setInterval(() => {
      if (this.nameText.length === this.name.length) this.lastCharacterFlag = true;
      if (this.lastCharacterFlag) {
        if (!this.directionFlag) {
          this.nameText = this.nameText.slice(0, -1);
          this.i++;
          if (this.i === 3) { this.directionFlag = true; this.i = 0; }
        } else {
          this.nameText += this.name[(this.name.length - 3) + this.i];
          this.i++;
          if (this.i === 3) { this.directionFlag = false; this.i = 0; }
        }
      }
      if (!this.lastCharacterFlag) this.nameText += this.name[this.nameIndex++];
    }, 500);
  }

  openBottomSheet(): void {
    if (!this.router.url.match(/\/home/)) this.sharedState.showHome = true;
    this.MenuComponentRef = this._bottomSheet.open(MenuComponent, {});
  }

  toggle($event: any) {
    this.switch = !$event.checked;
    this._snackBar.open(`Dark mode ${this.switch ? 'enabled.' : 'disabled.'}`, 'Dismiss', {
      duration: 2000
    });
    this.stateService.triggerToolbarSwitch(!$event.checked);
  }
}

@Component({
  selector: 'bottom-sheet',
  templateUrl: './menu.html',
})
export class MenuComponent {
  constructor(private _bottomSheetRef: MatBottomSheetRef<MenuComponent>, public router: Router, public sharedState: sharedMenuState) {
    this._bottomSheetRef.afterDismissed().subscribe(_ => {
      if (this.router.url.match(/\/home/)) this.sharedState.showHome = false;
      else this.sharedState.showHome = true;
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