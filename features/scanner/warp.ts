export type Point={x:number;y:number};
export function homography(from:Point[],to:Point[]){
 const a:number[][]=[];for(let i=0;i<4;i++){const {x,y}=from[i],u=to[i].x,v=to[i].y;a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v])}
 for(let c=0;c<8;c++){let p=c;for(let r=c+1;r<8;r++)if(Math.abs(a[r][c])>Math.abs(a[p][c]))p=r;[a[c],a[p]]=[a[p],a[c]];if(Math.abs(a[c][c])<1e-10)throw Error('Invalid perspective');const f=a[c][c];for(let j=c;j<9;j++)a[c][j]/=f;for(let r=0;r<8;r++)if(r!==c){const k=a[r][c];for(let j=c;j<9;j++)a[r][j]-=k*a[c][j]}}
 return [...a.map(r=>r[8]),1];
}
export function project(h:number[],p:Point):Point{const z=h[6]*p.x+h[7]*p.y+1;return{x:(h[0]*p.x+h[1]*p.y+h[2])/z,y:(h[3]*p.x+h[4]*p.y+h[5])/z}}
