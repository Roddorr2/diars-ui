import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { routes } from "./app/app.routes";
import { authInterceptor } from "./app/auth/auth.interceptor";
import { importProvidersFrom } from "@angular/core";
import { FormsModule } from "@angular/forms";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(FormsModule)
  ],
}).catch((err) => console.error(err));
