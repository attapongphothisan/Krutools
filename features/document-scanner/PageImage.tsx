import type {DocumentPage} from './session';
export function pageViewBox(page:DocumentPage){return page.rotation%180?`0 0 ${page.height} ${page.width}`:`0 0 ${page.width} ${page.height}`}
export function PageArtwork({page}:{page:DocumentPage}){
 const {width:w,height:h,rotation:r}=page;
 const transform=r===90?`translate(${h} 0) rotate(90)`:r===180?`translate(${w} ${h}) rotate(180)`:r===270?`translate(0 ${w}) rotate(270)`:undefined;
 return <g transform={transform}><image href={page.previewUrl} width={w} height={h}/></g>;
}
export function PageImage({page,label}:{page:DocumentPage;label:string}){
 return <svg className="document-page-image" viewBox={pageViewBox(page)} role="img" aria-label={label}><PageArtwork page={page}/></svg>;
}
