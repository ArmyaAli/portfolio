import { Component } from '@angular/core';
import { CareerModel } from 'src/models/data';
import data from '../../assets/data.json';
@Component({
  selector: 'app-career',
  templateUrl: './career.component.html',
  styleUrls: ['./career.component.css']
})
export class CareerComponent {
  data: CareerModel[] = data.career;
  
  constructor() {
  }

}
