import {readSheet} from './read';
self.onmessage=(event:MessageEvent<{frame:ImageData;expected:{examId:string;questionCount:number}}>)=>{self.postMessage(readSheet(event.data.frame,event.data.expected))};
