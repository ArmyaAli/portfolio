import { Component } from '@angular/core';
import data from '../../assets/data.json';
@Component({
  selector: 'app-education',
  templateUrl: './education.component.html',
  styleUrls: ['./education.component.css']
})
export class EducationComponent {
  data = data.education;
}
