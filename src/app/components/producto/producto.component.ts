import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ProductoService } from "./../../services/producto.service";
import { Producto } from "../../models/producto.model";
import { Subcategoria } from "./../../models/subcategoria.model";
import { SubcategoriaService } from "./../../services/subcategoria.service";

@Component({
  selector: "app-producto",
  imports: [],
  templateUrl: "./producto.component.html",
  styleUrl: "./producto.component.css",
})
export class ProductoComponent implements OnInit {
  productos: Producto[] = [];
  subcategorias: Subcategoria[] = [];
  formularioProducto!: FormGroup;

  modoEdicion: boolean = false;
  productoSeleccionadoId?: number;
  mostrarModal: boolean = false;

  constructor(
    private productoService: ProductoService,
    private subcategoriaService: SubcategoriaService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarProductos();
    this.cargarSubcategorias();
  }

  inicializarFormulario(): void {
    this.formularioProducto = this.fb.group({
      codigo: ["", Validators.required],
      nombre: ["", Validators.required],
      marca: ["", Validators.required],
      descripcion: [""],
      subcategoria: [null, Validators.required],
      stock: [0, Validators.required],
      precioUnitario: [0, Validators.required],
      unidadMedida: ["UND", Validators.required],
      estado: [true],
    });
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe((data) => {
      this.productos = data;
    });
  }

  cargarSubcategorias(): void {
    this.subcategoriaService
      .listar()
      .subscribe((data) => (this.subcategorias = data));
  }

  registrar(): void {
    if (this.formularioProducto.invalid) return;

    const producto: Producto = {
      ...this.formularioProducto.value,
      subcategoria: {
        id: this.formularioProducto.value.subcategoria,
      } as Subcategoria,
    };
    this.productoService.registrar(producto).subscribe(() => {
      this.cargarProductos();
      this.cancelar();
    });
  }

  editar(producto: Producto): void {
    this.modoEdicion = true;
    this.productoSeleccionadoId = producto.id;
    this.mostrarModal = true;

    this.formularioProducto.patchValue({
      codigo: producto.codigo,
      nombre: producto.nombre,
      marca: producto.marca,
      descripcion: producto.descripcion,
      subcategoria: producto.subcategoria?.id,
      stock: producto.stock,
      precioUnitario: producto.precioUnitario,
      unidadMedida: producto.unidadMedida,
      estado: producto.estado,
    });
  }
}
