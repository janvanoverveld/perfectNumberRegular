import * as http from 'http';
import * as request from 'request';
import * as fs from 'fs';

const httpHeaders = {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'};
var   messageResolver: (msg: any) => void;

const httpServer:http.Server = http.createServer(
  (req,res) => {
     let body = '';
     req.on('data', (chunk:string) => body += chunk );
     req.on('end',  () => { const msg = JSON.parse(body);
                            if ( msg && msg.name === 'RESULT' && msg.sumOfDivisors === msg.valueToCalculate ){
                               perfectNumberArray.push(msg.valueToCalculate);
                            } else {
                               messageResolver(JSON.parse(body));
                            }
                            res.write("OK");
                            res.end(); } );
  }
);

async function waitForMessage():Promise<any>{
   let promise = new Promise<any>( resolve => messageResolver = resolve );
   return promise;
}

async function sendMessage (host:string, port:number,msg:any) {
    let resolver: () => void;
    const promise = new Promise( resolve => resolver = resolve );
    const httpInfo = { url: `http://${host}:${port}`
                 , headers: httpHeaders
                    , body: msg
                    , json: true };
    request.post( httpInfo, () => resolver() );
    return promise;
}

async function startSend(totalNumbers:number, groupSize:number, host:string, port:number){
   let index=1;
   for ( let i=0; i<totalNumbers; i += groupSize ){
      // console.log(`perfectNumberServer, sending ${i}`);
      // hostFrom:string  portFrom:number  valueToCalculateFrom:number   valueToCalculateTo:number  CALC.name
      const msg = {name:'CALC',hostFrom:host,portFrom:port,valueToCalculateFrom:i,valueToCalculateTo:(i+groupSize-1)};
      await sendMessage(host, port+index, msg);
      index++;
      if ( index > 5 ) index = 1;
   }
   // indicate all numbers are send
   for ( let i=1; i < 6; i++){
      // export class BYE extends Message { constructor(hostFrom:string, portFrom:number) { super(BYE.name,hostFrom,portFrom);
      await sendMessage(host,port+i, {name:'BYE',hostFrom:host,portFrom:port} );
   }
}

const perfectNumberArray:number[] = [];

async function executeReceive(){
   var   byeCounter=0;
   while ( byeCounter < 5 ){
      const msg = await waitForMessage();
      //if ( msg && msg.name === 'RESULT' && msg.sumOfDivisors === msg.valueToCalculate )
      //console.log(`perfect number ${(<RESULT>msg).valueToCalculate}`);
      //   perfectNumberArray.push(msg.valueToCalculate);
      if ( msg && msg.name === 'BYE' ) {
         byeCounter++;
      }
   }
   setTimeout( () => httpServer.close(), 50 );
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
   httpServer.listen(port);
   await startSend(totalNumbers,groupSize,host,port);
   await executeReceive();
   fs.appendFile('../log/perfectNumberResults.txt', `${totalNumbers}-${groupSize}-->${perfectNumberArray} \n`, (err) => { if (err) throw err; } );
}

starter(process.argv);
