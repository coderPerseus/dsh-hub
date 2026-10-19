import { describe, expect, it } from 'vitest';
import { DshHubClient, detailShard, loadStaticIndex, searchStaticCatalog, type StaticIndex } from '../src/index';
const index: StaticIndex = {schemaVersion:1,snapshotId:'v1',generatedAt:'2026-09-12T00:00:00Z',categories:[],items:[
  {id:'a',slug:'owner/a',name:'中文记忆',packageName:'memory',description:'cross-session memory',repositoryUrl:'https://github.com/owner/a',descriptionZh:'跨会话记忆保存',searchText:'memory cross-session memory',searchTextZh:'memory 跨会话 记忆 保存',stars:10,pushedAt:null,featured:false,categories:['memory'],compatibilityStatus:'unknown',compatibilityLevel:'unverified',installCommand:'npm i memory'},
  {id:'b',slug:'owner/b',name:'Tools',packageName:'tools',description:'tools',repositoryUrl:'https://github.com/owner/b',stars:20,pushedAt:null,featured:true,categories:['development'],compatibilityStatus:'compatible',compatibilityLevel:'declared',installCommand:null,searchText:'tools development'},
]};
describe('static catalog',()=>{
  const directory = {schemaVersion: 2 as const, snapshotId: index.snapshotId, generatedAt: index.generatedAt, categories: index.categories, itemCount: 2, shards: ['/catalog/v1/a.json', '/catalog/v1/b.json']};
  it('loads all shards before global sorting and pagination, then reuses them', async () => {
    const requested: string[] = [];
    const client = new DshHubClient({fetch: async input => {
      const path = new URL(input.toString()).pathname;
      requested.push(path);
      if (path.endsWith('manifest.json')) return Response.json({schemaVersion: 2, index: '/catalog/v1/index.json'});
      if (path.endsWith('index.json')) return Response.json(directory);
      return Response.json({...index, items: [index.items[path.endsWith('a.json') ? 0 : 1]]});
    }});
    const first = await client.search({sort: 'stars', limit: 1});
    expect(first.total).toBe(2);
    expect(first.items[0].id).toBe('b');
    expect((await client.search({sort: 'stars', limit: 1, cursor: first.nextCursor})).items[0].id).toBe('a');
    expect((await client.search({query: '记忆'})).total).toBe(1);
    expect(requested).toHaveLength(4);
  });
  it('rejects partial, mismatched and unknown indexes explicitly', async () => {
    for (const shard of [{...index, items: []}, {...index, snapshotId: 'wrong'}]) {
      await expect(loadStaticIndex('root', async file => file === 'root' ? directory : shard)).rejects.toThrow('Catalog index');
    }
    await expect(loadStaticIndex('root', async () => ({schemaVersion: 9} as unknown as StaticIndex))).rejects.toThrow('update @dshhubs/client');
  });
  it('preserves repeated source rows but rejects repeated shard paths', async () => {
    const sameRow = {...index, items: [index.items[0]]};
    const result = await loadStaticIndex('root', async file => file === 'root' ? directory : sameRow);
    expect(result.items).toEqual([index.items[0], index.items[0]]);
    await expect(loadStaticIndex('root', async () => ({...directory, shards: ['same', 'same']}))).rejects.toThrow('Unsupported catalog index format');
  });
  it('refreshes the manifest if an individual shard disappeared after deployment', async () => {
    let manifests = 0;
    const client = new DshHubClient({fetch: async input => {
      const path = new URL(input.toString()).pathname;
      if (path.endsWith('manifest.json')) return Response.json({schemaVersion: 2, index: `/catalog/v${++manifests}/index.json`});
      if (path === '/catalog/v1/index.json') return Response.json(directory);
      if (path === '/catalog/v1/b.json') return new Response(null, {status: 404});
      return Response.json(index);
    }});
    expect((await client.search()).total).toBe(2);
    expect(manifests).toBe(2);
  });
  it('searches Chinese and filters categories without a server',()=>{
    expect(searchStaticCatalog(index,{query:'记忆',locale:'zh-CN'}).items.map(p=>p.id)).toEqual(['a']);
    expect(searchStaticCatalog(index,{query:'保存',locale:'en'}).items[0].description).toBe('cross-session memory');
    expect(searchStaticCatalog(index,{query:'cross-session',locale:'zh-CN'}).items[0].description).toBe('跨会话记忆保存');
    expect(searchStaticCatalog(index,{query:'记忆',locale:'zh-TW'}).items.map(p=>p.id)).toEqual(['a']);
    expect(searchStaticCatalog(index,{query:'记忆',locale:'zh-CN'}).items[0].description).toBe('跨会话记忆保存');
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
