import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import {importProvidersFrom} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {provideHttpClient} from "@angular/common/http";
import {provideRouter} from "@angular/router";
import {routes} from "./app/app.routes";

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(FormsModule), provideRouter(routes), provideHttpClient()]
}).catch(err => console.error(err));
