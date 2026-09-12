import { renderToString } from 'react-dom/server';
import { App, type PageData } from './app';
export function render(data: PageData) { return renderToString(<App data={data} />); }
