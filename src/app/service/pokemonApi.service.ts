import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { take, map, filter } from 'rxjs/operators';

@Injectable()
export class PokemonApiService {
  constructor(private http: HttpClient) { }

  getListPokemonsData(count: number = 20, limit: number = 20): Observable<any[]> {
    return this.http.get(`${environment.mainDataApi}?limit=${limit}&offset=${count}`)
      .pipe(
        take(1),
        map(item => item['results'])
      );
  }

  getDetailedPokemonData(id: number): Observable<object[]> {
    return this.http.get(`${environment.detailedApi}${id}`)
      .pipe(
        take(1),
        map(item => item['abilities'])
      );
  }

  getAbilitiesDescr(url: string): Observable<object[]> {
    return this.http.get(url)
      .pipe(
        take(1),
        map(item => item['effect_entries'])
      )
  }

  getPhotoUrl(id: number): string {
    return `${environment.pokemonPictApi}${id + 1}.png`;
  }
}
