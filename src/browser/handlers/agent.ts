import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { HandlerContext, Handler } from './types.js';
import { sessionStore } from '../controller.js';
import { resolveVisible } from '../resolver.js';
import { flashClick, humanMove, humanPreClick, humanType, humanScroll, humanPause, sleep, rand, randInt } from '../human.js';
import { annotateInteractive, accessibilityTree, findByRef, findSimilar, getAgentElements, type AgentElement } from '../agent.js';
import { assertNoAntiBot, assertUsefulPage } from '../polite.js';
import { safeFilePart } from '../security.js';

export function agentHandlers(ctx: HandlerContext): Record<string, Handler> {
  const getEl = async (ref: any, retry = true): Promise<AgentElement> => {
    const sessionId = sessionStore.getStore();
    let el = findByRef(ref, sessionId);
    if (!el && retry) {
      const oldElements = getAgentElements(sessionId);
      const oldEl = oldElements.find(e => String(e.id) === String(ref));

      await annotateInteractive(await ctx.p(), sessionId);
      el = findByRef(ref, sessionId);

      if (!el && oldEl) {
        const newElements = getAgentElements(sessionId);
        let bestMatch = newElements.find(e => e.role === oldEl.role && e.name === oldEl.name && e.tag === oldEl.tag);
        if (!bestMatch) {
          bestMatch = newElements.find(e => e.role === oldEl.role && e.name === oldEl.name);
        }
        if (!bestMatch && oldEl.name) {
          bestMatch = newElements.find(e => e.name === oldEl.name);
        }
        if (bestMatch) {
          el = bestMatch;
        }
      }
    }
    if (!el) {
      const suggestions = typeof ref === 'string' 
        ? findSimilar(ref, sessionId).map(e => `${e.id}: ${e.name}`).join(', ')
        : getAgentElements(sessionId).map(e => `${e.id}: ${e.name}`).slice(0, 5).join(', ');
      
      throw new Error(`Element "${ref}" not found. ${suggestions ? `Did you mean: ${suggestions}?` : 'No interactive elements found.'}`);
    }
    return el;
  };

  return {
    'page.annotate': async (payload: any = {}) => {
      let page = await ctx.p();
      let retries = 3;
      const noImage = payload?.noImage ?? false;
      while (retries > 0) {
        try {
          await page.waitForLoadState('domcontentloaded').catch(() => {});
          await assertNoAntiBot(page);
          await assertUsefulPage(page, 'page.annotate');
          const sessionId = sessionStore.getStore();
          const { elements, imageB64 } = await annotateInteractive(page, sessionId);
          const dir = join(process.cwd(), 'logs', 'screenshots');
          await mkdir(dir, { recursive: true });
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const sid = safeFilePart(sessionId);
          const filename = `annotate-${ts}-session-${sid}.jpg`;
          const path = join(dir, filename);
          await writeFile(path, Buffer.from(imageB64, 'base64'));
          const port = process.env.PORT ?? 8080;
          const imageUrl = `http://localhost:${port}/captures/${filename}`;
          return { 
            ...(noImage ? {} : { image: imageB64 }), 
            imageUrl, 
            elements, 
            url: page.url(), 
            title: await page.title() 
          };
        } catch (e: any) {
          if (e.message.includes('Execution context was destroyed') || e.message.includes('Target closed') || e.message.includes('Navigating')) {
            retries--;
            await sleep(500);
            page = await ctx.p();
            continue;
          }
          throw e;
        }
      }
      throw new Error('Failed to annotate after multiple retries due to navigation');
    },

    'agent.summary': async () => {
      const page = await ctx.p();
      const { items, total } = await accessibilityTree(page, { limit: 15 });
      const url = page.url();
      const title = await page.title();
      return {
        url,
        title,
        elementCount: total,
        summary: `Page: ${title}\nURL: ${url}\nInteractive elements: ${total}`,
        topElements: items,
      };
    },

    'agent.tree': async () => {
      const page = await ctx.p();
      const { items, total } = await accessibilityTree(page);
      return { url: page.url(), title: await page.title(), tree: items, total };
    },

    'agent.click': async ({ ref, double = false, retry = true }) => {
      const page = await ctx.p();
      const sessionId = sessionStore.getStore() || 'default';
      const maxAttempts = retry ? 2 : 1;
      let lastErr: Error | null = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          if (attempt > 1) await annotateInteractive(page, sessionId);
          const el = await getEl(ref, retry);
          const x = el.box.x + Math.round(el.box.w / 2);
          const y = el.box.y + Math.round(el.box.h / 2);
          await humanPreClick(page, x, y);
          await sleep(rand(15, 60));
          if (double) {
            await page.mouse.dblclick(x, y);
          } else {
            await page.mouse.click(x, y, { delay: randInt(15, 60) });
          }
          await flashClick(page, x, y);
          await assertNoAntiBot(page);
          return { clicked: el.name || el.role, ref, x, y, attempts: attempt };
        } catch (err) {
          lastErr = err as Error;
          if (attempt >= maxAttempts) break;
          await sleep(300);
        }
      }
      const available = getAgentElements(sessionId).map((e: AgentElement) => `${e.id}: ${e.name}`).slice(0, 10).join(', ');
      throw new Error(`${lastErr?.message ?? 'click failed'}. Available elements: ${available}...`);
    },

    'agent.type': async ({ ref, text, clearFirst = true, retry = true }: any) => {
      const page = await ctx.p();
      const val = String(text ?? '');
      const sessionId = sessionStore.getStore() || 'default';
      const el = await getEl(ref, retry).catch(async (err: Error) => {
        const available = getAgentElements(sessionId).map((e: AgentElement) => `${e.id}: ${e.name}`).slice(0, 10).join(', ');
        throw new Error(`${err.message}. Available elements: ${available}...`);
      });
      const x = el.box.x + Math.round(el.box.w / 2);
      const y = el.box.y + Math.round(el.box.h / 2);
      await humanPreClick(page, x, y);
      await page.mouse.click(x, y, { delay: randInt(15, 50) });
      await flashClick(page, x, y);
      await humanPause(40, 110);
      if (clearFirst) {
        const isMac = process.platform === 'darwin';
        await page.keyboard.press(isMac ? 'Meta+a' : 'Control+a');
        await sleep(rand(15, 40));
        await page.keyboard.press('Delete');
        await sleep(rand(15, 35));
      }
      await humanType(page, val);
      return { typed: val.length, ref };
    },

    'agent.press': async ({ key, ref, retry = true }: any) => {
      const page = await ctx.p();
      const beforeUrl = page.url();
      if (ref !== undefined) {
        const el = await getEl(ref, retry);
        if (el) {
          const x = el.box.x + Math.round(el.box.w / 2);
          const y = el.box.y + Math.round(el.box.h / 2);
          await humanMove(page, x, y);
          await page.mouse.click(x, y);
          await flashClick(page, x, y);
          await sleep(rand(15, 45));
        }
      }
      await page.keyboard.press(String(key));
      
      let navigated = false;
      if (key === 'Enter') {
        try {
          await Promise.race([
            page.waitForLoadState('domcontentloaded', { timeout: 4000 }),
            sleep(1000)
          ]);
          navigated = page.url() !== beforeUrl;
        } catch { /* ignored */ }
      }
      
      return { 
        key, 
        navigated, 
        url: page.url(), 
        title: await page.title().catch(() => '') 
      };
    },

    'agent.scroll': async ({ direction = 'down', amount = 600, x, y }: any) => {
      const page = await ctx.p();
      const a = Math.abs(amount);
      const dy = direction === 'up' ? -a : direction === 'down' ? a : 0;
      const dx = direction === 'left' ? -a : direction === 'right' ? a : 0;
      if (typeof x === 'number' && typeof y === 'number') await humanMove(page, x, y);
      await humanScroll(page, dy, dx);
      await assertNoAntiBot(page);
      return { ok: true };
    },

    'agent.discoverScroll': async ({ direction = 'down', amount = 650, steps = 5, annotate = true }: any = {}) => {
      const page = await ctx.p();
      const captures = [];
      const safeSteps = Math.max(1, Math.min(Number(steps) || 5, 20));
      const delta = direction === 'up' ? -Math.abs(Number(amount) || 650) : Math.abs(Number(amount) || 650);
      let stepsDone = 0;
      for (let i = 0; i < safeSteps; i++) {
        stepsDone++;
        await humanScroll(page, delta);
        await sleep(rand(180, 420));
        await assertNoAntiBot(page);
        if (annotate && ctx.dispatch) {
          const ann = await ctx.dispatch('page.annotate', { noImage: true });
          captures.push({
            step: i + 1,
            url: ann.url,
            title: ann.title,
            imageUrl: ann.imageUrl,
            elements: ann.elements?.length ?? 0,
          });
        }
        const atEnd = await page.evaluate(() => {
          const root = document.scrollingElement || document.documentElement;
          return root.scrollTop + window.innerHeight >= root.scrollHeight - 8;
        }).catch(() => false);
        if (atEnd && direction === 'down') break;
      }
      return { ok: true, steps: stepsDone, captures };
    },

    'agent.waitFor': async ({ text, url, timeout = 12000 }: any) => {
      const page = await ctx.p();
      if (url) {
        await page.waitForURL(url instanceof RegExp ? url : new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), {
          timeout,
        });
      } else if (text) {
        await page.getByText(String(text), { exact: false }).first().waitFor({ state: 'visible', timeout });
      } else {
        await page.waitForLoadState('domcontentloaded');
      }
      return { url: page.url(), title: await page.title() };
    },

    'agent.hover': async ({ ref, retry = true }: any) => {
      const page = await ctx.p();
      const sessionId = sessionStore.getStore() || 'default';
      const el = await getEl(ref, retry).catch(async (err: Error) => {
        const available = getAgentElements(sessionId).map((e: AgentElement) => `${e.id}: ${e.name}`).slice(0, 10).join(', ');
        throw new Error(`${err.message}. Available elements: ${available}...`);
      });
      const x = el.box.x + Math.round(el.box.w / 2);
      const y = el.box.y + Math.round(el.box.h / 2);
      await humanMove(page, x, y);
      return { hovered: el.name || el.role, ref };
    },

    'agent.select': async ({ ref, option, retry = true }: any) => {
      const page = await ctx.p();
      const el = await getEl(ref, retry);
      // Locate the <select> under the annotated box rather than guessing from its name.
      const marker = `ab-${Date.now()}-${randInt(0, 1e6)}`;
      const marked = await page.evaluate(({ x, y, marker }) => {
        const hit = document.elementFromPoint(x, y);
        const select = hit instanceof HTMLSelectElement ? hit : hit?.closest('select');
        if (!select) return false;
        select.setAttribute('data-agentbridge-select', marker);
        return true;
      }, { x: el.box.x + el.box.w / 2, y: el.box.y + el.box.h / 2, marker }).catch(() => false);
      let loc;
      if (marked) {
        loc = page.locator(`[data-agentbridge-select="${marker}"]`);
      } else if (el.name) {
        loc = page.locator(el.tag, { hasText: el.name }).or(page.locator(`[aria-label=${JSON.stringify(el.name)}]`)).first();
      } else if (typeof ref === 'string') {
        loc = await resolveVisible(page, ref);
      } else {
        throw new Error(`agent.select: element not found — ref: ${ref}`);
      }
      const selected = await loc.selectOption(String(option));
      if (marked) await loc.evaluate((node) => node.removeAttribute('data-agentbridge-select')).catch(() => {});
      return { selected };
    },
  };
}
