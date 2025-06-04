import { Component, inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
//
import { Categoria } from "./../../models/categoria.model";
import { SubcategoriaService } from "./../../services/subcategoria.service";
import { Router } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { FormsModule } from "@angular/forms";

import Swal from "sweetalert2";

@Component({
  selector: "app-subcategoria",
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: "./subcategoria.component.html",
  styleUrl: "./subcategoria.component.css",
})
export class SubcategoriaComponent implements OnInit {
  router = inject(Router);
  volver() {
    this.router.navigate(["/dashboard"]);
  }

  ngOnInit(): void {
    // this.cargarSubcategorias();
  }
}
