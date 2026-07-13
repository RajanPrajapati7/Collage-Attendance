import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

class FallbackQueryBuilder {
  constructor(private readonly result: { data: unknown; error: null } = { data: [], error: null }) {}

  select() { return this; }
  order() { return this; }
  eq() { return this; }
  insert() { return Promise.resolve({ data: null, error: null }); }
  update() { return Promise.resolve({ data: null, error: null }); }
  delete() { return Promise.resolve({ data: null, error: null }); }

  then(resolve: (value: { data: unknown; error: null }) => unknown) {
    return Promise.resolve(this.result).then(resolve);
  }

  catch(reject: (reason?: unknown) => unknown) {
    return Promise.resolve(this.result).catch(reject);
  }
}

function createFallbackClient() {
  return {
    from: () => new FallbackQueryBuilder(),
  };
}

if (!url || !anonKey) {
  console.warn('Supabase env vars are missing. Falling back to empty demo data.');
}

export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
    })
  : createFallbackClient();
