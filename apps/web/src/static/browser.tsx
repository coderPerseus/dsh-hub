import { hydrateRoot } from 'react-dom/client';
import { App, type PageData } from './app';
import '../app/styles.css';
import '../app/submission.css';
const data = JSON.parse(document.getElementById('page-data')!.textContent!) as PageData;
hydrateRoot(document.getElementById('root')!, <App data={data} />);
