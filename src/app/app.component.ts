import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Ali\'s Portfolio';
  constructor(private mir: MatIconRegistry, private domSanitizer: DomSanitizer, private route: ActivatedRoute
  ) {
    this.mir
      .addSvgIcon('linkedin', this.domSanitizer.bypassSecurityTrustResourceUrl("assets/linkedin.svg"))
      .addSvgIcon('github', this.domSanitizer.bypassSecurityTrustResourceUrl("assets/github.svg"))
      .addSvgIcon('twitter', this.domSanitizer.bypassSecurityTrustResourceUrl("assets/twitter.svg"))

    // loopback to known routes if unknown url
    this.route.url.subscribe((urlCtxPath) => {
      const url = window.location.pathname;
      let match = false;
      ['career', 'education', 'home', 'resume', 'contact'].forEach((path) => {
        if (url.includes(path)) match = true;
      });
      if(!match) window.location.pathname = '/home';
    })
  }

}
