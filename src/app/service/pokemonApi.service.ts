import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { take, map } from 'rxjs/operators';

@Injectable()
export class PokemonApiService {
  constructor(private http: HttpClient) { }

  getListPokemonsData(count: number = 20): Observable<object[]> {
    return this.http.get(`${environment.mainDataApi}?limit=20&offset=${count}`)
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

  getAbilitiesDescr(url: string): Observable<object> {
    return this.http.get(url)
      .pipe(
        // map(item => item)
      )
  }

  getPhotoUrl(id: number): string {
    return `${environment.pokemonPictApi}${id + 1}.png`;
  }
}
