/// <reference types="vite/client" />

export function assetPath(path:string){
 return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
