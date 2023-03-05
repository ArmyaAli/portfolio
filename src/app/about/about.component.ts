import { Component, EventEmitter } from '@angular/core';
import data from '../../assets/data.json';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  data = data.about;
  aboutText = "";
  interests: any = []
  skills: any = []
  animatedAboutTextIndex = 0;
  animatedSkillsTextIndex = 0;
  animatedInterestsTextIndex = 0;

  EventEndOfAboutText = new EventEmitter();
  EventEndOfSkillstText = new EventEmitter();
  EventEndOfInterestsText = new EventEmitter();

  aboutTextTimerId: any;
  aboutSkillsTimerId: any;
  aboutInterestsTimerId: any;

  ngOnInit() {
    this.aboutTextTimerId = setInterval(() => {
      this.aboutText += this.data.description[this.animatedAboutTextIndex++]
      if (this.animatedAboutTextIndex === this.data.description.length) { this.EventEndOfAboutText.emit(); }
    }, 12.5);

    this.aboutSkillsTimerId = setInterval(() => {
      this.skills.push(this.data.skills[this.animatedSkillsTextIndex++]);
      if (this.animatedSkillsTextIndex === this.data.skills.length) { this.EventEndOfSkillstText.emit(); }
    }, 200);

    this.aboutInterestsTimerId = setInterval(() => {
      this.interests.push(this.data.interests[this.animatedInterestsTextIndex++]);
      if (this.animatedInterestsTextIndex === this.data.interests.length) { this.EventEndOfInterestsText.emit(); }
    }, 200);

    this.EventEndOfAboutText.subscribe(() => {
      clearInterval(this.aboutTextTimerId);
      this.animatedAboutTextIndex = 0;
    });

    this.EventEndOfSkillstText.subscribe(() => {
      clearInterval(this.aboutSkillsTimerId);
      this.animatedSkillsTextIndex = 0;
    });

    this.EventEndOfInterestsText.subscribe(() => {
      clearInterval(this.aboutInterestsTimerId);
      this.animatedInterestsTextIndex = 0;
    });
  }
}
