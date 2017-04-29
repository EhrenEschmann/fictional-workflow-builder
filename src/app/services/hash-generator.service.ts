import { Injectable } from '@angular/core';
import { WindowRef } from './window-ref.service';

@Injectable()
export class HashGenerator {

    // private readonly windowObj: Window
    constructor(
        private readonly winRef: WindowRef
    ) { }

    createHash = (): string => {
        let random = (Math.random() * 100000000000000000).toString();
        return this.winRef.nativeWindow.btoa(random);
    }
}