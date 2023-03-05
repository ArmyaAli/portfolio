import { EventEmitter, Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of, Subject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class stateService {
  darkModeSwitch = new BehaviorSubject<boolean>(true);

  triggerToolbarSwitch(value: boolean = false){
    this.darkModeSwitch.next(value);
  }

  getToolBarSwitchValue(){
    return this.darkModeSwitch.asObservable(); 
  }
}