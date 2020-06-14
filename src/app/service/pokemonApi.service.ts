import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { take, map, finalize } from 'rxjs/operators';
import { ConnectionService } from 'ng-connection-service';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../environments/environment';
import { IPokemon } from './pokemon.model';

@Injectable()
export class PokemonApiService {
  private pictureAPI = environment.pokemonPictApi;
  private basicDataAPI = environment.mainDataApi;

  private listAllPokemons: IPokemon[] = [];
  private listPokemons: IPokemon[] = [];
  private pokemonsAbilities: object;

  listPokemons$ = new BehaviorSubject<IPokemon[]>(this.listPokemons);
  selectedPokemon$ = new BehaviorSubject<IPokemon>(null);
  showMoreBtn$ = new BehaviorSubject<boolean>(true);
  pokemonsAbilities$ = new BehaviorSubject<object>({});

  constructor(
    private http: HttpClient, 
    private connectionService: ConnectionService,
    private toastr: ToastrService
    ) {
    if (localStorage.getItem('allPokemons')) {
      try {
        this.listAllPokemons = JSON.parse(localStorage.getItem('allPokemons'));
        this.findPokemons();
      } catch (err) {
        console.log('error in localStorage: ', err);
        localStorage.removeItem('allPokemons');
        this.setFullPokemonsList();
      }
    } else {
      this.setFullPokemonsList();
    }

    if (localStorage.getItem('pokemonsAbilities')) {
      try {
        this.pokemonsAbilities = JSON.parse(
          localStorage.getItem('pokemonsAbilities')
        );
        this.pokemonsAbilities$.next(this.pokemonsAbilities);
      } catch (e) {
        this.pokemonsAbilities = {};
      }
    } else {
      this.pokemonsAbilities = {};
    }

    this.connectionService.monitor().subscribe(isConnected => {
      if (isConnected) {
        this.toastr.success("Connection restored", "Hooraaaay!");
      }
      else {
        this.toastr.error('Connection is lost!', 'Sorry...');
      }
    })
  }

  public findPokemons(limit = 20, searchingWord: string = ''): void {
    this.listPokemons = this.listAllPokemons.filter((pokemon) =>
      pokemon.name.match(new RegExp(searchingWord, 'i'))
    );

    this.showMoreBtn$.next(
      this.listPokemons.length !== this.listPokemons.slice(0, limit).length
    );
    this.listPokemons = this.listPokemons.slice(0, limit);

    this.listPokemons$.next(
      (this.listPokemons = this.listPokemons.map((pokemon) => {
        if (pokemon['abilities']) {
          return pokemon;
        }

        const sub$ = this.getDetailedPokemonData(pokemon.url)
          .pipe(
            take(1),
            finalize(() => {
              console.log('ability request');
              sub$.unsubscribe();
            })
          )
          .subscribe((data) => {
            pokemon.abilities = data.map((abil) => abil['ability']);

            const localPokemonsList = JSON.parse(
              localStorage.getItem('allPokemons')
            );
            localPokemonsList[pokemon.id - 1].abilities = pokemon.abilities;
            localStorage.setItem(
              'allPokemons',
              JSON.stringify(localPokemonsList)
            );
          });
        return pokemon;
      }))
    );
  }

  private setFullPokemonsList(): void {
    console.log('Pokemon list request');
    let id: number = 1;

    const sub$ = this.getListPokemonsData(0, 1000)
      .pipe(
        finalize(() => {
          localStorage.setItem(
            'allPokemons',
            JSON.stringify(this.listAllPokemons)
          );
          this.findPokemons();
          sub$.unsubscribe();
        })
      )
      .subscribe(
        (data) =>
          (this.listAllPokemons = data.map((pokemon) => {
            pokemon.id = id;
            pokemon.src = this.getPhotoUrl(id);
            id++;
            return pokemon;
          }))
      );
  }

  public showMorePokemons(findingWord = ''): void {
    const LENGTH_POKEMONS = this.listPokemons.length;
    this.findPokemons(LENGTH_POKEMONS + 20, findingWord);
  }

  public setAbilities(pokemon: IPokemon): void {
    pokemon.abilities.forEach((ability) => {
      if (this.pokemonsAbilities[ability.url]) {
        return;
      }
      const sub$ = this.getAbilitiesDescr(ability.url)
        .pipe(
          finalize(() => {
            console.log('ability description request');
            localStorage.setItem(
              'pokemonsAbilities',
              JSON.stringify(this.pokemonsAbilities)
            );
            this.selectedPokemon$.next(pokemon);
            this.pokemonsAbilities$.next(this.pokemonsAbilities);
            sub$.unsubscribe();
          })
        )
        .subscribe(
          (data) =>
            (this.pokemonsAbilities[ability.url] = data
              .filter((item) => item['language']['name'] === 'en')
              .map((item) => item['effect'])[0])
        );
    });
  }

  private getListPokemonsData(count: number = 20, limit: number = 20): Observable<IPokemon[]> {
    return this.http
      .get(`${this.basicDataAPI}?limit=${limit}&offset=${count}`)
      .pipe(
        take(1),
        map((item) => item['results'])
      );
  }

  private getDetailedPokemonData(url: string): Observable<object[]> {
    return this.http.get(url).pipe(
      take(1),
      map((item) => item['abilities'])
    );
  }

  private getAbilitiesDescr(url: string): Observable<object[]> {
    return this.http.get(url).pipe(
      take(1),
      map((item) => item['effect_entries'])
    );
  }

  private getPhotoUrl(id: number): string {
    return `${this.pictureAPI}${id}.png`;
  }
}
