import * as http from 'http';
import {Message} from './Messages';

const numberAndSumOfDivisorArray:Message[] = [];

function httpPerfectNumberServerFunction(req:http.IncomingMessage,res:http.ServerResponse):void {
   const httpHeaders = {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'};
   if ( req.method === 'POST' ) {
      let postData:string;
      req.on('data', (data) => { postData = (postData===undefined)?data: postData+data; });
      req.on('end',  () => { try { //console.log(`perfectNumberServer, bericht ontvangen  ${postData}`);
                                   const msg:Message = JSON.parse(postData);
                                   numberAndSumOfDivisorArray.push(msg);
                                   tryResolver();
                                   res.writeHead(200, "OK", httpHeaders);
                                   res.end();
                             }
                             catch (err) {
                                   res.writeHead(400, "wrong message", httpHeaders);
                             } } );
      return;
   }
   res.writeHead(404, "page not found", httpHeaders);
}

const httpServerPerfectNumber:http.Server = http.createServer(httpPerfectNumberServerFunction);
const start:(port:number)=>void = (p) => httpServerPerfectNumber.listen(p);
const terminate:()=>void = () =>  httpServerPerfectNumber.close();

var resolver: ((item: Message) => void) | null = null;

function tryResolver() {
   if ( resolver ) {
      const item = numberAndSumOfDivisorArray.shift();
      if (item) resolver(item);
   }
}

async function getMessage(): Promise<Message> {
   const promise = new Promise<Message>( resolve => resolver = resolve );
   tryResolver();
   return promise;
}

const perfectNumberServer = { start: start
,                         terminate: terminate
,                        getMessage: getMessage
}

export {perfectNumberServer}
