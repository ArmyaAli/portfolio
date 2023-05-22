import { Component } from '@angular/core';
import data from '../../assets/data.json';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  socials = data.socials
}
