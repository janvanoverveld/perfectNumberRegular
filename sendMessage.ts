import * as request from 'request';
import {Message} from './Messages';

var resolver: ( () => void) | null = null;
var rejector: (reason?: any) => void;

async function sendMessage ( toHost:string, toPort:number, msg:Message ):Promise<void> {
   const promise = new Promise<void>( (resolve,reject) => { resolver = resolve; rejector = reject; } );
   const options = { url: `http://${toHost}:${toPort}`,
                     headers: {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'},
                     body: msg,
                     json: true };
   request.post( options,
                   (err,response,body) => {
                       if ( response && response.statusCode === 200 ) {
                          if (resolver) {
                              resolver();
                              return;
                          }
                       }
                       if ( response ){
                          console.log(`sendMessage status error = ${response.statusCode}`);
                       }
                       if (err) {
                           console.log(`sendmessage error`);
                           console.log(`${err}`);
                           rejector(err);
                       }
                       if (body){
                           console.log(`sendMessage body = ${body}`);
                       }
                   }
               );
   return promise;
}

export {sendMessage}