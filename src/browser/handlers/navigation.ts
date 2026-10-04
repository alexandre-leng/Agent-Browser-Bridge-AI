import type { HandlerContext, Handler } from './types.js';
import { validate, validateUrl } from './validate.js';
import { politeGoto } from '../polite.js';

const ENGINES = ['google', 'bing', 'duckduckgo'] as const;

export const SEARCH_URLS: Record<string, (q: string) => string> = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
};

export function searchUrl(engine: unknown, query: unknown, cmd = 'search'): string {
  const name = String(engine ?? 'google');
  if (!Object.hasOwn(SEARCH_URLS, name)) throw new Error(`${cmd}: unsupported engine "${name}" (use ${ENGINES.join(', ')})`);
  if (typeof query !== 'string' || !query.trim()) throw new Error(`${cmd}: query is required`);
  return SEARCH_URLS[name](query);
}

export function navigationHandlers(ctx: HandlerContext): Record<string, Handler> {
  return {
    navigate: async (payload: any) => {
      validate(payload, {
        url: { type: 'string', required: true, min: 1 },
        waitUntil: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle', 'commit'] },
        autoAnnotate: { type: 'boolean' },
      }, 'navigate');
      const url = validateUrl(payload.url, 'navigate');
      const page = await ctx.p();
      const polite = await politeGoto(page, url, { waitUntil: payload.waitUntil ?? 'domcontentloaded' });
      const result: any = { url: page.url(), title: await page.title(), polite };
      if (payload.autoAnnotate && ctx.dispatch) {
        const ann = await ctx.dispatch('page.annotate', {});
        Object.assign(result, ann);
      }
      return result;
    },

    search: async (payload: any) => {
      validate(payload, {
        engine: { type: 'string', enum: ENGINES },
        query: { type: 'string', required: true, min: 1, max: 500 },
      }, 'search');
      const url = searchUrl(payload.engine, payload.query);
      const page = await ctx.p();
      // This command exists to open a search engine results page, so the
      // "direct app search" guard must not block it.
      await politeGoto(page, url, { waitUntil: 'domcontentloaded', allowDirectSearch: true });
      return { url: page.url(), title: await page.title() };
    },

    'dom.goto': async (payload: any) => {
      validate(payload, { url: { type: 'string', required: true } }, 'dom.goto');
      const url = validateUrl(payload.url, 'dom.goto');
      await politeGoto(await ctx.p(), url);
      return { ok: true };
    },
  };
}
