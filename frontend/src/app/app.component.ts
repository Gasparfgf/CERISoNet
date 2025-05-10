import { CommonModule, NgClass } from "@angular/common";
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from "./components/login/login.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, FormsModule, ReactiveFormsModule, NgClass, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
}
