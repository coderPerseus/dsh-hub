import { describe, expect, it } from 'vitest';
import { generateMidwayJson } from '../../../scripts/lib/midway-generate.mjs';

const options = {apiKey:'test-secret', model:'gemini-3.5-flash', prompt:'fixture', timeoutMs:1000};
describe('Midway offline generation', () => {
  it('requests JSON and reads completed answer parts without thoughts', async () => {
    const result = await generateMidwayJson({...options, fetch: async (url, init) => {
      expect(new URL(String(url)).hostname).toBe('mediocre-new-api.midway.run');
      expect(JSON.parse(String(init?.body)).generationConfig.responseMimeType).toBe('application/json');
      expect(init?.redirect).toBe('error');
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'private reasoning'},{text:'[{"id":"a"}]'}]}}]});
    }});
    expect(result).toEqual([{id:'a'}]);
  });
  it('uses the selected DeepSeek model through chat completions with bearer authentication', async () => {
    const result = await generateMidwayJson({...options, model:'deepseek-flash', fetch:async (url, init) => {
      expect(String(url)).toBe('https://mediocre-new-api.midway.run/v1/chat/completions');
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-secret');
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe('deepseek-flash');
      expect(body.thinking).toEqual({type:'disabled'});
      expect(body.messages).toEqual([{role:'user',content:'fixture'}]);
      return Response.json({choices:[{finish_reason:'stop',message:{reasoning_content:'ignore',content:'[{"id":"a"}]'}}]});
    }});
    expect(result).toEqual([{id:'a'}]);
  });
  it('rejects unfinished DeepSeek answers and object-shaped output', async () => {
    for (const finish_reason of ['length','content_filter',undefined]) {
      await expect(generateMidwayJson({...options, model:'deepseek-flash', fetch:async () => Response.json({choices:[{finish_reason,message:{content:'[]'}}]})})).rejects.toThrow('incomplete');
    }
    await expect(generateMidwayJson({...options, model:'deepseek-flash', fetch:async () => Response.json({choices:[{finish_reason:'stop',message:{content:'{}'}}]})})).rejects.toThrow('non-array');
  });
  it('rejects truncated output instead of saving a partial batch', async () => {
    await expect(generateMidwayJson({...options, fetch: async () => Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'[]'}]}}]})})).rejects.toThrow('incomplete');
  });
  it('does not expose credentials echoed by gateway errors', async () => {
    await expect(generateMidwayJson({...options, fetch: async () => Response.json({error:{code:'get_channel_failed',message:'key=test-secret'}},{status:500})})).rejects.toThrow('Midway HTTP 500: get_channel_failed');
    await expect(generateMidwayJson({...options, fetch: async () => {throw new Error('URL?key=test-secret');}})).rejects.toThrow('Midway request failed or timed out');
  });
  it('rejects malformed JSON', async () => {
    await expect(generateMidwayJson({...options, fetch: async () => Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'broken'}]}}]})})).rejects.toThrow('invalid JSON');
  });
});
