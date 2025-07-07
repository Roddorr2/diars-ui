import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { Router } from "@angular/router";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  router = inject(Router);
  username: string = "";

  ngOnInit(): void {
    this.username = localStorage.getItem("username") || "Usuario";
  }

  cerrarSesion() {
    localStorage.removeItem("token");
    this.router.navigate(["/login"]);
  }
}
