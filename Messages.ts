export abstract class Message {
    constructor(public name:string, public hostFrom:string, public portFrom:number){};
}

export class CALC extends Message{
    constructor(hostFrom:string, portFrom:number, public valueToCalculate:number){
        super(CALC.name, hostFrom, portFrom);
    }
}

export class RESULT extends Message {
    constructor(hostFrom:string, portFrom:number, public valueToCalculate:number, public sumOfDivisors:number){
        super(RESULT.name,hostFrom,portFrom);
    }
}

export class BYE extends Message {
    constructor(hostFrom:string, portFrom:number) {
        super(BYE.name,hostFrom,portFrom);
    }
}
