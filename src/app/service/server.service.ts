import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Status } from '../enum/status.enum';
import { CustomResponse } from '../interface/custom-response';
import { Server } from '../interface/server';

//inside this class we will make all the functions we need to make http request.

@Injectable({ providedIn: 'root' })
export class ServerService {

  constructor(private http: HttpClient) {
  }
  //                 PROCEDURAL---APPROACH OF DOING IT
  //   getServers(): Observable<CustomResponse> {
  //     return this.http.get<CustomResponse>('http://localchost:8096/server/list')    
  //  }

  //                 REACTIVE---APPROACH OF DOING IT
  private readonly apiUrl = 'http://localhost:8096';
  //observable returning list of servers //variable+ "$ sign" to remember its an observable
  servers$ = <Observable<CustomResponse>>/// typecasting the result to observable of custom response, from type"any"
    //Subscriber function As a publisher, you create an Observable instance that defines a subscriber function. This is the function that is executed when a consumer calls the subscribe() method. The subscriber function defines how to obtain or generate values or messages to be published.
    this.http.get<CustomResponse>(`${this.apiUrl}/server/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  save$ = (server: Server) => <Observable<CustomResponse>>
    //all theser http functions return observableeven if we don't say return Observable
    this.http.post<CustomResponse>(`${this.apiUrl}/server/save`, server)     //observable saving a server
      .pipe( // we can call .pipe on it, b/c http functions return observable
        tap(console.log),
        catchError(this.handleError)
      );

  ping$ = (ipAddress: string) => <Observable<CustomResponse>>
    this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAddress}`)     //observable pinging a server
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  //you stopped here /// typecasting the result of (<CustomResponse>) to observable of custom response(Observable<CustomResponse>)
  filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
    new Observable<CustomResponse>(
      subscriber => {  //Observer
        console.log(response);
        subscriber.next(

          status === Status.ALL ? { ...response, message: `Servers filtered by ${status} status` } ://copy everything in the response & override the message property in the response object      
            {
              ...response,
              message: response.data.servers
                .filter(serv => serv.status === status).length > 0 ? `Servers filtered by
                            ${status === Status.SERVER_UP ? 'SERVER UP' : 'SERVER DOWN'} status`
                : `No servers of ${status} found`,

              data: {
                servers: response.data.servers.filter(serv => serv.status === status)

              }
            }
        )
        subscriber.complete();
      }
    )
    .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  delete$ = (serverId: number) => <Observable<CustomResponse>>
    this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/${serverId}`)     //observable deleting a server
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(`An error occured - Error code: ${error.status}`);//we can send complex object of error
  }
}

