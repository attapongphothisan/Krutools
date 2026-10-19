import {fileURLToPath} from 'node:url';
import {readdirSync,statSync} from 'node:fs';
import {join,relative,sep} from 'node:path';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const repository=process.env.GITHUB_REPOSITORY?.split('/')[1]??'';
const base=process.env.PAGES_BASE_PATH??(repository&&!repository.endsWith('.github.io')?`/${repository}/`:'/');
function publicFiles(directory:string):string[]{
 return readdirSync(directory).flatMap(name=>{const path=join(directory,name);return statSync(path).isDirectory()?publicFiles(path):[relative('public',path).split(sep).join('/')]});
}

export default defineConfig({
 base,
 plugins:[react(),{
  name:'pages-offline-precache',
  generateBundle(_options,bundle){
   const appFiles=Object.keys(bundle).filter(name=>name!=='index.html');
   const publicAssets=publicFiles('public').filter(name=>name.startsWith('tool-images/')||name.startsWith('fonts/'));
   this.emitFile({type:'asset',fileName:'precache.json',source:JSON.stringify([...new Set(['index.html','manifest.webmanifest',...appFiles,...publicAssets])])});
  },
 }],
 resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
 build:{outDir:'dist-pages',emptyOutDir:true},
});
