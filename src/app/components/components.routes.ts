import { Routes } from "@angular/router";
import { ProductoComponent } from "./producto/producto.component";
import { SubcategoriaComponent } from "./subcategoria/subcategoria.component";
import { CategoriaComponent } from "./categoria/categoria.component";
import { SucursalComponent } from "./sucursal/sucursal.component";
import { CargoComponent } from "./cargo/cargo.component";
import { ProveedorComponent } from "./proveedor/proveedor.component";
import { UsuarioComponent } from "./usuario/usuario.component";

export const COMPONENTS_ROUTES: Routes = [
  { path: "producto", component: ProductoComponent },
  { path: "subcategoria", component: SubcategoriaComponent },
  { path: "categoria", component: CategoriaComponent },
  { path: "sucursal", component: SucursalComponent },
  { path: "cargo", component: CargoComponent },
  { path: "proveedor", component: ProveedorComponent },
  { path: "usuario", component: UsuarioComponent },
];
