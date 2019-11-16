import * as http from 'http';
import {CALC,RESULT,Message, BYE} from './Messages';
import {sendMessage} from './sendMessage';

const messages:Message[] = [];
var resolver: ((item: Message) => void) | null = null;

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

async function getMessage(): Promise<Message> {
    let promise = new Promise<Message>((resolve, reject) => resolver = resolve );
    tryResolve();
    return promise;
}

function tryResolve(): void {
   if ( resolver ) {
       let item: Message|undefined = undefined;
       item = messages.shift();
       if (item) {
           resolver(item);
           resolver = null;
       }
   }
}

async function processNumbers(host:string,port:number){
   const calcMessagesArray:CALC[] = [];
   let msg = await getMessage();
   while (true){
      if (msg.name === CALC.name) {
         calcMessagesArray.push(<CALC>msg);
         msg = await getMessage();
      }
      if ( msg.name === BYE.name) {
         const byeMessage = <BYE> msg;
         for ( const calc of calcMessagesArray ){
            for ( let i=calc.valueToCalculateFrom; i<=calc.valueToCalculateTo; i++){
               const sumOfDivisors = getSumOfDivisors(i);
               if ( i === sumOfDivisors ){
                  const resultMsg:RESULT=new RESULT(host,port,i,sumOfDivisors);
                  await sendMessage(calc.hostFrom, calc.portFrom,resultMsg);
               }
            }
         }
         await sendMessage(byeMessage.hostFrom,byeMessage.portFrom, new BYE(host,port));
         terminate();
         break;
      }
   }
}

function httpSumOfDivisorServerFunction(req:http.IncomingMessage,res:http.ServerResponse):void {
   const httpHeaders = {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'};
   if ( req.method === 'POST' ) {
      let postData:string;
      req.on('data', (data) => { postData = (postData===undefined)?data: postData+data; });
      req.on('end',  () => { try { //console.log(`sumOfDivisorServer, bericht ontvangen  ${postData}`);
                                   messages.push(JSON.parse(postData));
                                   tryResolve();
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

const httpSumOfDivisorServer:http.Server = http.createServer(httpSumOfDivisorServerFunction);
const start:(port:number)=>void = (p) => httpSumOfDivisorServer.listen(p);

function terminate(){ setTimeout( () => httpSumOfDivisorServer.close(), 50 );}

const sumOfDivisorsServer = { start: start
,                         terminate: terminate
}

function starter(pars:string[]){
  console.log(`start sumOfDivisor ${pars[2]} server for port ${pars[3]}`);
  if (pars[2] && pars[3]) {
    const host:string = pars[2];
    const port:number = Number(pars[3]);
    sumOfDivisorsServer.start(port);
    processNumbers(host,port);
  }
}

starter(process.argv);
