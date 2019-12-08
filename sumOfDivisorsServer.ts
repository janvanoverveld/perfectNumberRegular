import * as http from 'http';
import * as request from 'request';

var host = 'localhost';
var port = 30000;
const calcMessagesArray:any[] = [];

const httpServer:http.Server = http.createServer(
   (req,res) => {
     let body = '';
     req.on('data', (chunk:string) => body += chunk );
     req.on('end',  () => { let msg = JSON.parse(body);
                            if ( msg.name && msg.name === 'CALC') {
                               calcMessagesArray.push(msg);
                            }
                            if ( msg.name && msg.name === 'BYE') {
                               setTimeout( () => processNumbers(host,port,msg), 10 );
                               setTimeout( () => httpServer.close(), 50 );
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

//
// berekenen van sum van divisors
function getSumOfDivisors(numberToCheck:number):number{
   let   sumDivisors = 0;
   const halfOfNumberToCheck = Math.ceil(numberToCheck/2);
   for ( let i=halfOfNumberToCheck; i>0; i-- ){
      if ( numberToCheck%i === 0 ){
         sumDivisors += i;
         if ( sumDivisors > numberToCheck ) break;
      }
   }
   return sumDivisors;
}

async function processNumbers(host:string,port:number,msg:any){
   for ( const calc of calcMessagesArray ){
      for ( let i=calc.valueToCalculateFrom; i<=calc.valueToCalculateTo; i++){
         const sumOfDivisors = getSumOfDivisors(i);
         if ( i === sumOfDivisors ){
            const resultMsg= {name:'RESULT',portFrom:port,valueToCalculate:i,sumOfDivisors:sumOfDivisors};
            sendMessage(calc.hostFrom, calc.portFrom,resultMsg);
         }
      }
   }
   sendMessage(msg.hostFrom,msg.portFrom,{name:'BYE',hostFrom:host,portFrom:port});
}

function starter(pars:string[]){
  console.log(`start sumOfDivisor ${pars[2]} server for port ${pars[3]}`);
  if (pars[2] && pars[3]) {
    host = pars[2];
    port = Number(pars[3]);
    httpServer.listen(port);
  }
}

starter(process.argv);
