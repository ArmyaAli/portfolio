import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from "@angular/platform-browser";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Ali\'s Portfolio';
  constructor(private mir: MatIconRegistry, private domSanitizer: DomSanitizer
  ) {
    this.mir
      .addSvgIcon('linkedin', this.domSanitizer.bypassSecurityTrustResourceUrl("assets/linkedin.svg"))
      .addSvgIcon('github', this.domSanitizer.bypassSecurityTrustResourceUrl("assets/github.svg"))
      .addSvgIcon('twitter', this.domSanitizer.bypassSecurityTrustResourceUrl("assets/twitter.svg"))
  }

}
