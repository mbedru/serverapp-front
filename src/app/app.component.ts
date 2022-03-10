import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, BehaviorSubject , of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { DataState } from './enum/data_state_enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Server } from './interface/server';
import { NotificationService } from './service/notification.service';
import { ServerService } from './service/server.service';

import { faCoffee } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit { //if u impl OnInit must define/implement ngOnInit
  faCoffee = faCoffee;//fontawesome
  appState$: Observable<AppState<CustomResponse>>  //we said we will capture entire State of the application
  readonly DataState = DataState;
  readonly Status = Status;
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  private filterSubject = new BehaviorSubject<string>('');
  filterStatus$ = this.filterSubject.asObservable();
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  //private readonly notifier: NotifierService;

  constructor(private serverService: ServerService, private notifier: NotificationService) { } //dependency injection
//when this component start... this function also fires
  ngOnInit(): void { 
    this.appState$ = this.serverService.servers$ //we gonna subscribe to this observable(appState$) in the ui by using async pipe
     .pipe(
       map( response => {
         this.notifier.onDefault(response.message);
         this.dataSubject.next(response);
         return { dataState: DataState.LOADED_STATE, appData: {...response, data: {servers: response.data.servers.reverse()} } }
       }),
       startWith({ dataState: DataState.LOADING_STATE }),
       catchError( (error: string) => {
        this.notifier.onError(error);
        return of({ dataState: DataState.ERROR_STATE, error : error })//or we can just say error(js will understand it as error: error) b/c they have the same name //of is another way to create observable on the fly.
       } )
     
      )
  }
  pingServer(ipAddress: string): void { 
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress) //we gonna subscribe to this observable(appState$) in the ui by using async pipe
     .pipe(
       map( response => {
         const index = this.dataSubject.value.data.servers.findIndex(server => server.id === response.data.server.id);
         this.dataSubject.value.data.servers[index] = response.data.server;
         this.notifier.onDefault(response.message);         
         this.filterSubject.next('');
         return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
       }),
       startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
       catchError( (error: string) => {
        this.notifier.onError(error);
        this.filterSubject.next('');
         return of({ dataState: DataState.ERROR_STATE, error : error })
       } )
     
      )
  }

  saveServer(serverForm: NgForm): void { 
    this.isLoadingSubject.next(true);
    this.appState$ = this.serverService.save$(serverForm.value) // 1)serverForm.value senlew json(key value)hono slemihed then the back end wede Server object yikeyrewal
    .pipe(                             //eziw convert to Server mareg kefelegn gn=>> 2)severForm.value as Server  OR 3) <Server>serverForm.value
    map( response => {
      this.dataSubject.next(
        {...response, data: { servers: [ response.data.server, ...this.dataSubject.value.data.servers]}}
      );
      this.notifier.onDefault(response.message);      
      this.isLoadingSubject.next(false);
      document.getElementById('closeModal').click();
      serverForm.reset({status: this.Status.SERVER_DOWN});
      return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
    }),
    startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
    catchError( (error: string) => {
      this.notifier.onError(error);
      this.isLoadingSubject.next(false);
      document.getElementById('closeModal').click();
      //serverForm.reset({status: this.Status.SERVER_DOWN});
       return of({ dataState: DataState.ERROR_STATE, error : error })
    } )
    
      )
  }
  filterServers(status: Status): void {
   console.log(status);
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          this.notifier.onDefault(response.message);  
          return { dataState: DataState.LOADED_STATE, appData: response };
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
    }
    deleteServer(serverId: number): void { //the guy received the whole server //but only the server id was enough.
      this.appState$ = this.serverService.delete$(serverId) //we gonna subscribe to this observable(appState$) in the ui by using async pipe
       .pipe(
         map( response => {
           this.dataSubject.next(
             {...response, data: 
                {servers: this.dataSubject.value.data.servers.filter(s=>s.id !== serverId)}}
           );
           this.notifier.onDefault(response.message);  
           return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
         }),
         startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
         catchError( (error: string) => {
           this.notifier.onError(error);
           return of({ dataState: DataState.ERROR_STATE, error : error })
         } )
        )
    }
    printReport(): void {
     //as pdf
     // window.print();
     // as excel
      let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
      let tableSelect = document.getElementById('servers');
      let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
      let downloadLink = document.createElement('a');
      document.body.appendChild(downloadLink);
      downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
      downloadLink.download = 'my-server-report.xls';
      downloadLink.click();
      document.body.removeChild(downloadLink);
      this.notifier.onDefault('Report Downloaded');  
      
    }
  }

