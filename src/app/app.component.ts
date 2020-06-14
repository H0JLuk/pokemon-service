import { isPlatformBrowser } from '@angular/common';
import { Component, Renderer2, Input, ViewChild, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';

import { PokemonApiService } from './service/pokemonApi.service';
import { IPokemon } from './service/pokemon.model';

export interface InfiniteScrollOptions {
  [key: string]: any;
  root: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  showModalPokemon: boolean = false;
  showNoResult: boolean;

  selectedPokemon: IPokemon;
  pokemonsAbilities: object;

  @Input() findingWord: string = '';
  @ViewChild('nameInp') nameInp: ElementRef;

  constructor(
    public pokemonService: PokemonApiService,
    private renderer: Renderer2,
  ) {
    this.pokemonService.listPokemons$.subscribe(
      (pokemonList) => (this.showNoResult = !pokemonList.length)
    );
    this.pokemonService.selectedPokemon$.subscribe(
      (data) => (this.selectedPokemon = data)
    );
    this.pokemonService.pokemonsAbilities$.subscribe(
      (data) => (this.pokemonsAbilities = data)
    );
  }

  onScroll() {
    console.log('scrolled');
  }

  ngAfterViewInit() {
    this.nameInp.nativeElement.focus();  
  }


  findPokemons(limit = 20): void {
    this.pokemonService.findPokemons(limit, this.findingWord);
  }

  showMorePokemons(): void {
    this.pokemonService.showMorePokemons(this.findingWord);
  }

  toggleModal(pokemon: IPokemon = null): void {
    if (!this.showModalPokemon) {
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      this.pokemonService.selectedPokemon$.next(pokemon);
      this.pokemonService.setAbilities(pokemon);
    } else {
      this.renderer.setStyle(document.body, 'overflow', 'auto');
      this.pokemonService.selectedPokemon$.next(null);
    }
    this.showModalPokemon = !this.showModalPokemon;
  }
}
