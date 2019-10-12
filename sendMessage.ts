import * as request from 'request';
import {Message} from './Messages';

async function sendMessage ( toHost:string, toPort:number, msg:Message ):Promise<void> {
   const options = { url: `http://${toHost}:${toPort}`,
                     headers: {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'},
                     body: msg,
                     json: true };
   return new Promise(
       (resolve,reject) => {
               request.post( options,
                   (err) => {
                       if (err) {
                           console.log(`perfectNumberServer, error sendMessage ${err}`);
                           reject(err);
                       }
                       else {
                           resolve();
                       }
                   }
               )
       }
   );
}

export {sendMessage}