import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {localeFromPath} from '../apps/web/src/lib/i18n/routing';
const root=path.resolve(import.meta.dirname,'..');
const port=Number(process.env.PORT || 3000);
const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/','http://localhost');
    if(url.pathname==='/'||url.pathname.startsWith('/plugins/')){
      res.writeHead(301,{Location:'/zh-CN'+url.pathname+url.search});res.end();return;
    }
    const locale=localeFromPath(url.pathname);
    const base=locale ? path.join(root,'apps/web/.static-build/locales',locale) : path.join(root,'apps/web/dist');
    let target=path.resolve(base,'.'+decodeURIComponent(url.pathname));
    if(!target.startsWith(base+path.sep)||['_headers','_redirects'].includes(path.basename(target))){res.writeHead(404);res.end();return;}
    let info=await stat(target).catch(()=>null);
    if(info?.isDirectory()){
      if(!url.pathname.endsWith('/')){res.writeHead(301,{Location:url.pathname+'/'+url.search});res.end();return;}
      target=path.join(target,'index.html');info=await stat(target).catch(()=>null);
    }
    const status=info?.isFile() ? 200 : 404;
    if(status===404){target=path.join(base,'404.html');info=await stat(target);}
    res.writeHead(status,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':info!.size});
    if(req.method==='HEAD'){res.end();return;}
    createReadStream(target).on('error',()=>res.destroy()).pipe(res);
  }catch{res.writeHead(500);res.end('Build the static site before starting preview.');}
}).listen(port,'127.0.0.1',()=>console.log(`Static locale preview: http://127.0.0.1:${port}/zh-CN/`));
