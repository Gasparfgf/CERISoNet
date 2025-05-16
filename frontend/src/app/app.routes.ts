import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from "./components/login/login.component";
import { StudyGroupsComponent } from './components/study-group/study-group.component';

export const routes: Routes = [
  { path: 'study-groups', component: StudyGroupsComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'login', component: LoginComponent},
  {path:'home', component: HomeComponent}
];
