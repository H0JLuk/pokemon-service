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

  @Input() findingWord: string;
  findingList: object[] = [];

  constructor(
    public pokemonService: PokemonApiService,
    private renderer: Renderer2,
    @Self() private ngOnDestroy$: NgOnDestroy
  ) {
    // localStorage.clear()
    this.getAllPokemonsList();

    this.pokemonsAbilities =
      JSON.parse(localStorage.getItem('pokemonsAbilities')) || {};

    localStorage.getItem('pokemonsList')
      ? (this.listPokemons = JSON.parse(
          localStorage.getItem('pokemonsList')
        ).filter((i, index) => index < 20))
      : this.showMorePokemons();
  }

  findPokemons(): void {
    this.listPokemons = this.listAllPokemons.filter((pokemon) =>
      pokemon.name.match(new RegExp(this.findingWord, 'gi'))
    ).slice(0, 20);
    console.log(this.listPokemons);
    
    
  }

  getAllPokemonsList(): void {
    if (localStorage.getItem('allPokemons')) {
      this.listAllPokemons = JSON.parse(localStorage.getItem('allPokemons'));
    } else {
      this.pokemonService
        .getListPokemonsData(0, 1000)
        .pipe(takeUntil(this.ngOnDestroy$))
        .subscribe((data) => (this.listAllPokemons = data))
        .add(() => localStorage.setItem('allPokemons', JSON.stringify(this.listAllPokemons)));
    }
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

    this.pokemonService
      .getListPokemonsData(length)
      .pipe(takeUntil(this.ngOnDestroy$))
      .subscribe((data) => {
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
              ),
              takeUntil(this.ngOnDestroy$)
            )
            .subscribe(
              (elem) =>
                (item['abilities'] = elem.map((abil) => abil['ability']))
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
          ),
          takeUntil(this.ngOnDestroy$)
        )
        .subscribe(
          (data) =>
            (this.pokemonsAbilities[item.url] = data
              .filter((elem) => elem['language']['name'] === 'en')
              .map((elem) => elem['effect'])[0])
        )
        .add(() => console.log('ability request'));
    });
  }
}
