import { Pipe, PipeTransform } from '@angular/core';
import { map, Observable } from 'rxjs';
import { stateService } from './state.service';

@Pipe({ name: 'darkLightPipe' })
export class darkLightPipe implements PipeTransform {
  constructor(private stateService: stateService) { }
  transform(curr: String): Observable<string> {
    return this.stateService.getToolBarSwitchValue().pipe(map((value) => {
      let output = value ? curr + " " + 'dark' : curr + " " + 'light';
      if (curr === "vertical-line")
        output = value ? curr + " " + 'vertical-line-dark' : curr + " " + 'vertical-line-light';
      return output;
    }));
  }
}