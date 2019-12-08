import * as http from 'http';
import * as request from 'request';
import * as fs from 'fs';

const perfectNumberArray:number[] = [];
var   totalNumbers=0;
var   groupSize=0;
var   byeCounter=0;

const httpServer:http.Server = http.createServer(
  (req,res) => {
     let body = '';
     req.on('data', (chunk:string) => body += chunk );
     req.on('end',  () => { const msg = JSON.parse(body);
                            if ( msg && msg.name === 'RESULT' && msg.sumOfDivisors === msg.valueToCalculate ){
                               perfectNumberArray.push(msg.valueToCalculate);
                            }
                            if ( msg && msg.name === 'BYE' ){
                               byeCounter++;
                            }
                            if ( byeCounter > 4 ){
                              setTimeout( () => httpServer.close(), 50 );
                              fs.appendFile('../log/perfectNumberResults.txt', `${totalNumbers}-${groupSize}-->${perfectNumberArray} \n`, (err) => { if (err) throw err; } );
                            }
                            res.write("OK");
                            res.end(); } );
  }
);

function sendMessage (host:string, port:number,msg:any) {
    request.post ( { url: `http://${host}:${port}`
               , headers: {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'}
                  , body: msg
                  , json: true } );
}

const sleep:(ms:number) => void = async (m) => new Promise(resolve => setTimeout(resolve, m));

async function startSend(totalNumbers:number, groupSize:number, host:string, port:number){
   let index=1;
   for ( let i=0; i<totalNumbers; i += groupSize ){
      // console.log(`perfectNumberServer, sending ${i}`);
      const msg = {name:'CALC',hostFrom:host,portFrom:port,valueToCalculateFrom:i,valueToCalculateTo:(i+groupSize-1)};
      sendMessage(host, port+index, msg);
      index++;
      if ( index > 5 ) index = 1;
   }
   await sleep(10);
   // indicate all numbers are send
   for ( let i=1; i < 6; i++) {
      sendMessage(host,port+i, {name:'BYE',hostFrom:host,portFrom:port} );
   }
}

async function starter(pars:string[]){
   let host='localhost';
   let port=30000;
   if (pars[2] && pars[3] && pars[4] && pars[5]) {
     host = pars[2];
     port = Number(pars[3]);
     totalNumbers = Number(pars[4]);
     groupSize = Number(pars[5]);
   }
   httpServer.listen(port);
   await startSend(totalNumbers,groupSize,host,port);
}

starter(process.argv);
