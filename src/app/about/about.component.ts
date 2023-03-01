import { Component } from '@angular/core';
import data from '../../assets/data.json';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  data = data.about;
}
