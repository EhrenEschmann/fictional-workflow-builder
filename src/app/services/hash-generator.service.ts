import { Injectable } from '@angular/core';
import { WindowRef } from './window-ref.service';

@Injectable()
export class HashGenerator {

//private readonly windowObj: Window
    constructor(private winRef: WindowRef) { }

    createHash = (): string => {
        var random = (Math.random()*100000000000000000).toString(); //"";//UUID.UUID();
        return this.winRef.nativeWindow.btoa(random);
        //return this.windowObj.btoa(random.toString());
    }

}