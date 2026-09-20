import { createReadStream } from 'node:fs';

export async function readHtmlHead(filename: string): Promise<string> {
  let head = '';
  for await (const chunk of createReadStream(filename, { encoding: 'utf8', highWaterMark: 8192 })) {
    head += chunk;
    const end = head.indexOf('</head>');
    if (end !== -1) return head.slice(0, end + 7);
  }
  throw new Error(`Missing closing head tag: ${filename}`);
}
