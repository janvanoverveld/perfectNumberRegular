import {Message,CALC,RESULT,BYE} from './Messages';
import {sendMessage} from './sendMessage';
import * as http from 'http';
import * as fs from 'fs';

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

function terminate(){
   setTimeout( () => httpServerPerfectNumber.close(), 50 );
}

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

async function startSend(totalNumbers:number, groupSize:number, host:string, port:number){
   let index=1;
   for ( let i=0; i<totalNumbers; i += groupSize ){
      //console.log(`perfectNumberServer, sending ${i}`);
      const msg = new CALC(host,port,i,(i+groupSize-1));
      await sendMessage(host, port+index, msg);
      index++;
      if ( index > 5 ) index = 1;
   }
   // indicate all numbers are send
   for ( let i=1; i < 6; i++){
      await sendMessage(host,port+i, new BYE(host,port) );
   }
}

const perfectNumberArray:number[] = [];

async function executeReceive(){
   var   byeCounter=0;
   var   teller = 0;
   while ( byeCounter < 5 ){
      const msg = await perfectNumberServer.getMessage();
      if ( msg && msg.name === RESULT.name && (<RESULT>msg).sumOfDivisors === (<RESULT>msg).valueToCalculate )
         //console.log(`perfect number ${(<RESULT>msg).valueToCalculate}`);
         perfectNumberArray.push((<RESULT>msg).valueToCalculate);
      if ( msg && msg.name === BYE.name ) {
         byeCounter++;
      }
   }
   perfectNumberServer.terminate();
}

async function starter(pars:string[]){
   let host='localhost';
   let port=30000;
   let totalNumbers=0;
   let groupSize=0;
   if (pars[2] && pars[3] && pars[4] && pars[5]) {
     host = pars[2];
     port = Number(pars[3]);
     totalNumbers = Number(pars[4]);
     groupSize = Number(pars[5]);
   }
   perfectNumberServer.start(port);
   await startSend(totalNumbers,groupSize,host,port);
   await executeReceive();
   fs.appendFile('../log/perfectNumberResults.txt', `${totalNumbers}-${groupSize}-->${perfectNumberArray} \n`, (err) => { if (err) throw err; } );
}

starter(process.argv);
