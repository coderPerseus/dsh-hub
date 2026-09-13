import {describe,it,expect} from 'vitest';
import {localeFromPath,localizedHref} from '../../../apps/web/src/lib/i18n/routing';

describe('locale page URLs',()=>{
  it('recognizes exact language segments only',()=>{
    expect(localeFromPath('/en/plugins/team/repo/')).toBe('en');
    expect(localeFromPath('/zh-TW/')).toBe('zh-TW');
    expect(localeFromPath('/english/')).toBeNull();
    expect(localeFromPath('/plugins/en/repo/')).toBeNull();
  });
  it('switches locale while preserving filters, cursor and fragment',()=>{
    expect(localizedHref('/zh-CN/?q=a%20b&category=agents&cursor=MjQ%3D#catalog','ja')).toBe('/ja/?q=a%20b&category=agents&cursor=MjQ%3D#catalog');
    expect(localizedHref('/en/plugins/Owner/Repo?x=1#install','ko')).toBe('/ko/plugins/Owner/Repo/?x=1#install');
    expect(localizedHref('/plugins/Owner/Repo/','en')).toBe('/en/plugins/Owner/Repo/');
    expect(localizedHref('/en/','en')).toBe('/en/');
  });
  it('keeps external, protocol-relative, fragment and asset links intact',()=>{
    for(const href of ['https://github.com/a/b','//example.com/a','mailto:a@example.com','#install','/catalog/manifest.json','/fonts/a.woff2','/api/v1/plugins']) expect(localizedHref(href,'en')).toBe(href);
  });
});
