import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from "@angular/forms"; 
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { AppComponent } from './app.component';
import { PokemonApiService } from './service/pokemonApi.service';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    LazyLoadImageModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    InfiniteScrollModule,
  ],
  providers: [
    PokemonApiService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
