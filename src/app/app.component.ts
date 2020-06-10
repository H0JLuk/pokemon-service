import {
  Component,
  Renderer2,
  Input,
  Injectable,
  OnDestroy,
  Self,
} from '@angular/core';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { PokemonApiService } from './service/pokemonApi.service';
import { IPokemon } from './service/pokemon.model';

@Injectable()
export class NgOnDestroy extends Subject<null> implements OnDestroy {
  ngOnDestroy() {
    this.next(null);
    this.complete();
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [NgOnDestroy],
})
export class AppComponent {
  showModalPokemon: boolean = false;

  listAllPokemons: IPokemon[] = [];
  listPokemons: IPokemon[] = [];
  selectedPokemon: IPokemon;
  pokemonsAbilities: object;

  showBtnMore: boolean = true;

  @Input() findingWord: string = '';
  findingList: object[] = [];

  constructor(
    public pokemonService: PokemonApiService,
    private renderer: Renderer2,
    @Self() private ngOnDestroy$: NgOnDestroy
  ) {
    // localStorage.clear();
    this.setFullPokemonsList();

    this.pokemonsAbilities =
      JSON.parse(localStorage.getItem('pokemonsAbilities')) || {};
  }

  private setFullPokemonsList(): void {
    if (localStorage.getItem('allPokemons')) {
      this.listAllPokemons = JSON.parse(localStorage.getItem('allPokemons'));
      this.findPokemons();
    } else {
      console.log('Pokemon list request');

      let id: number = 1;
      this.pokemonService
        .getListPokemonsData(0, 1000)
        .pipe(
          finalize(() => this.findPokemons()),
          takeUntil(this.ngOnDestroy$)
        )
        .subscribe(
          (data) =>
            (this.listAllPokemons = data.map((pokemon) => {
              pokemon.id = id++;
              return pokemon;
            }))
        )
        .add(() =>
          localStorage.setItem(
            'allPokemons',
            JSON.stringify(this.listAllPokemons)
          )
        );
    }
  }

  findPokemons(limit = 20): void {
    this.listPokemons = this.listAllPokemons.filter((pokemon) =>
      pokemon.name.match(new RegExp(this.findingWord, 'i'))
    );

    this.showBtnMore =
      this.listPokemons.length !== this.listPokemons.slice(0, limit).length;
    this.listPokemons = this.listPokemons.slice(0, limit);

    this.listPokemons = this.listPokemons.map((pokemon) => {
      if (pokemon.abilities) {
        return pokemon;
      }

      this.pokemonService
        .getDetailedPokemonData(pokemon.url)
        .pipe(
          finalize(() => this.saveDataInStorage()),
          takeUntil(this.ngOnDestroy$)
        )
        .subscribe(
          (data) => (pokemon.abilities = data.map((abil) => abil['ability']))
        )
        .add(() => console.log('ability request'));
      return pokemon;
    });
  }

  showMorePokemons(): void {
    const LENGTH_POKEMONS = this.listPokemons.length;
    this.findPokemons(LENGTH_POKEMONS + 20);
  }

  private saveDataInStorage(): void {
    let changed: boolean = false,
        localPokemonsList = JSON.parse(localStorage.getItem('allPokemons'));

    this.listPokemons.forEach((pokemon) => {
      if (localPokemonsList[pokemon.id - 1].abilities) {
        return;
      }

      changed = true;
      localPokemonsList[pokemon.id - 1].abilities = pokemon.abilities;
    });

    changed
      ? localStorage.setItem('allPokemons', JSON.stringify(localPokemonsList))
      : null;
  }

  toggleModal(id: number = null): void {
    if (!this.showModalPokemon) {
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      this.selectedPokemon = this.listPokemons.find(
        (pokemon) => pokemon.id === id
      );
      this.setAbilities();
    } else {
      this.renderer.setStyle(document.body, 'overflow', 'auto');
      this.selectedPokemon = null; // need to reset?
    }
    this.showModalPokemon = !this.showModalPokemon;
  }

  private setAbilities(): void {
    this.selectedPokemon.abilities.forEach((ability) => {
      if (this.pokemonsAbilities[ability.url]) {
        return;
      }
      this.pokemonService
        .getAbilitiesDescr(ability.url)
        .pipe(
          finalize(() =>
            localStorage.setItem(
              'pokemonsAbilities',
              JSON.stringify(this.pokemonsAbilities)
            )
          ),
          takeUntil(this.ngOnDestroy$)
        )
        .subscribe(
          (data) =>
            (this.pokemonsAbilities[ability.url] = data
              .filter((elem) => elem['language']['name'] === 'en')
              .map((elem) => elem['effect'])[0])
        )
        .add(() => console.log('ability description request'));
    });
  }
}
