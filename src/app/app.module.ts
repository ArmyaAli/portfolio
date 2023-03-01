import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './matetials.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { AboutComponent } from './about/about.component';
import { ToolbarComponent, MenuComponent, sharedMenuState} from './toolbar/toolbar.component';
import { FooterComponent } from './footer/footer.component';
import { ContactComponent } from './contact/contact.component';
import { CareerComponent } from './career/career.component';
import { EducationComponent } from './education/education.component';
import { ResumeComponent } from './resume/resume.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    AboutComponent,
    ToolbarComponent,
    FooterComponent,
    ContactComponent,
    CareerComponent,
    EducationComponent,
    ResumeComponent 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    MatExpansionModule
  ],
  providers: [sharedMenuState],
  bootstrap: [AppComponent]
})
export class AppModule { }
