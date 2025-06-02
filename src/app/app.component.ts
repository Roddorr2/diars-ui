import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  title = "Inicio de sesión";
}
