import { Routes } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { DashboardComponent } from "./dashboard.component";
import { ProductoComponent } from "./components/producto/producto.component";
import { SubcategoriaComponent } from "./components/subcategoria/subcategoria.component";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
  {
    path: "login",
    component: LoginComponent,
  },
  { path: "dashboard", component: DashboardComponent },
  {
    path: "components/producto",
    component: ProductoComponent,
  },
  {
    path: "components/subcategoria",
    component: SubcategoriaComponent,
  },
];
