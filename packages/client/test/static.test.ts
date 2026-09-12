import { describe, expect, it } from 'vitest';
import { DshHubClient, detailShard, searchStaticCatalog, type StaticIndex } from '../src/index';
const index: StaticIndex = {schemaVersion:1,snapshotId:'v1',generatedAt:'2026-09-12T00:00:00Z',categories:[],items:[
  {id:'a',slug:'owner/a',name:'中文记忆',packageName:'memory',description:'跨会话保存',repositoryUrl:'https://github.com/owner/a',stars:10,pushedAt:null,featured:false,categories:['memory'],compatibilityStatus:'unknown',compatibilityLevel:'unverified',installCommand:'npm i memory',searchText:'中文记忆 memory 跨会话保存'},
  {id:'b',slug:'owner/b',name:'Tools',packageName:'tools',description:'tools',repositoryUrl:'https://github.com/owner/b',stars:20,pushedAt:null,featured:true,categories:['development'],compatibilityStatus:'compatible',compatibilityLevel:'declared',installCommand:null,searchText:'tools development'},
]};
describe('static catalog',()=>{
  it('searches Chinese and filters categories without a server',()=>{
    expect(searchStaticCatalog(index,{query:'记忆'}).items.map(p=>p.id)).toEqual(['a']);
    expect(searchStaticCatalog(index,{categories:['memory'],compatibility:['compatible']}).total).toBe(0);
  });
  it('paginates deterministically and handles invalid cursors',()=>{
    const first=searchStaticCatalog(index,{sort:'stars',limit:1});expect(first.items[0].id).toBe('b');
    expect(searchStaticCatalog(index,{sort:'stars',limit:1,cursor:first.nextCursor}).items[0].id).toBe('a');
    expect(searchStaticCatalog(index,{cursor:'garbage'}).items).toHaveLength(2);
  });
  it('loads and reuses a versioned index, then reads the matching detail shard',async()=>{
    const requested:string[]=[];
    const client=new DshHubClient({fetch:async input=>{
      const path=new URL(input.toString()).pathname;requested.push(path);
      if(path==='/catalog/manifest.json')return Response.json({schemaVersion:1,snapshotId:'v1',index:'/catalog/v1/index.json',details:Array.from({length:256},(_,i)=>`/catalog/v1/details-${i}.json`)});
      if(path.endsWith('index.json'))return Response.json(index);
      return Response.json([{id:'a',slug:'owner/a',name:'中文记忆'}]);
    }});
    expect((await client.search({query:'记忆'})).total).toBe(1);
    await client.search({sort:'stars'});
    expect((await client.plugin('owner/a'))?.name).toBe('中文记忆');
    expect(requested).toEqual(['/catalog/manifest.json','/catalog/v1/index.json',`/catalog/v1/details-${detailShard('owner/a')}.json`]);
  });
  it('does not turn a missing catalog into a missing plugin',async()=>{
    const client=new DshHubClient({fetch:async()=>Response.json({}, {status:503})});
    await expect(client.plugin('owner/a')).rejects.toThrow('503');
  });
  it('refreshes a stale manifest once when deployment replaces its assets',async()=>{
    let manifests=0;
    const client=new DshHubClient({fetch:async input=>{
      const path=new URL(input.toString()).pathname;
      if(path.endsWith('manifest.json'))return Response.json({index:`/catalog/v${++manifests}/index.json`});
      return path.includes('/v1/') ? new Response(null,{status:404}) : Response.json(index);
    }});
    expect((await client.search()).total).toBe(2);
    expect(manifests).toBe(2);
  });
});
