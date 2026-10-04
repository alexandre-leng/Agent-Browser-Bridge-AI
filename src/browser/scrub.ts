const SENSITIVE_KEYS = new Set([
  'token',
  'admintoken',
  'admin_token',
  'password',
  'passwd',
  'pass',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'cookies',
]);

const REDACTED = '[redacted]';

// Commands whose `text` / `value` / `values` fields carry what the user typed
// (possibly a password), so they must never reach traces or logs.
const SENSITIVE_COMMANDS = new Set([
  'agent.type',
  'dom.type',
  'dom.fill',
  'dom.fillForm',
  'form.fill',
  'input.fill',
  'input.type',
  'input.text',
]);
const TYPED_KEYS = new Set(['text', 'value', 'values']);

export function scrubPayload(value: unknown, command?: string): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrubPayload(v, command));
  const obj = value as Record<string, unknown>;
  // Nested commands (batch / script.execute steps) are scrubbed with their own type.
  const nestedCommand = typeof obj.type === 'string' && obj.payload && typeof obj.payload === 'object' ? obj.type : undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = REDACTED;
      continue;
    }
    if (TYPED_KEYS.has(k) && command && SENSITIVE_COMMANDS.has(command)) {
      out[k] = REDACTED;
      continue;
    }
    out[k] = scrubPayload(v, k === 'payload' && nestedCommand ? nestedCommand : command);
  }
  return out;
}
