import { Component, Renderer2, Input } from '@angular/core';
import { PokemonApiService } from './service/pokemonApi.service';
import { map, finalize } from 'rxjs/operators';
import { ThrowStmt } from '@angular/compiler';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  showModalPokemon: boolean = false;

  listPokemons: any[] = [];
  selectedPokemon: any;
  pokemonsAbilities: object;
  @Input() findingWord: string;

  constructor(
    public pokemonService: PokemonApiService,
    private renderer: Renderer2
  ) {
    // localStorage.clear()
    this.pokemonsAbilities =
      JSON.parse(localStorage.getItem('pokemonsAbilities')) || {};

    localStorage.getItem('pokemonsList')
      ? (this.listPokemons = JSON.parse(
          localStorage.getItem('pokemonsList')
        ).filter((i, index) => index < 20))
      : this.showMorePokemons();
  }

  toggleModal(id: number = null): void {
    if (!this.showModalPokemon) {
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      this.selectedPokemon = this.listPokemons[id];
      this.selectedPokemon.id = id;
      this.setAbilities();
    } else {
      this.renderer.setStyle(document.body, 'overflow', 'auto');
      this.selectedPokemon = null; // need to reset?
    }
    this.showModalPokemon = !this.showModalPokemon;
  }

  showMorePokemons(): void {
    const LENGTH = this.listPokemons.length;
    const localPokemonsList =
      JSON.parse(localStorage.getItem('pokemonsList')) || [];

    localPokemonsList.length > LENGTH + 20
      ? (this.listPokemons = localPokemonsList.slice(0, LENGTH + 20))
      : this.setPokemonsData(LENGTH);
  }

  private setPokemonsData(length: number): void {
    console.log('request');

    this.pokemonService.getListPokemonsData(length).subscribe((data) => {
      data.forEach((item) => this.listPokemons.push(item));

      this.listPokemons = this.listPokemons.map((item, index) => {
        if (index < length) {
          return item;
        }
        this.pokemonService
          .getDetailedPokemonData(index + 1)
          .pipe(
            finalize(() =>
              localStorage.setItem(
                'pokemonsList',
                JSON.stringify(this.listPokemons)
              )
            )
          )
          .subscribe(
            (elem) => (item['abilities'] = elem.map((abil) => abil['ability']))
          );
        return item;
      });
    });
  }

  private setAbilities(): void {
    this.selectedPokemon.abilities.forEach((item) => {
      if (this.pokemonsAbilities[item.url]) {
        return;
      }
      this.pokemonService
        .getAbilitiesDescr(item.url)
        .pipe(
          finalize(() =>
            localStorage.setItem(
              'pokemonsAbilities',
              JSON.stringify(this.pokemonsAbilities)
            )
          )
        )
        .subscribe((data) => {
          console.log('ability request');

          data = data
            .filter((elem) => elem['language']['name'] === 'en')
            .map((elem) => elem['effect'])[0];
          this.pokemonsAbilities[item.url] = data;
        });
    });
  }
}
