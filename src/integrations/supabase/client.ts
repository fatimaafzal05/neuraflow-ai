import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type Row = Record<string, unknown>;
type AuthUser = { id: string; email: string; user_metadata: Record<string, unknown> };

const DB_KEY = "neuraflow.local.database";
const SESSION_KEY = "neuraflow.local.session";

function readDb(): Record<string, Row[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeDb(db: Record<string, Row[]>) {
  if (typeof window !== "undefined") localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as AuthUser | null;
  } catch {
    return null;
  }
}

function setUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

function localId() {
  return crypto.randomUUID();
}

class LocalQuery implements PromiseLike<{ data: Row[] | null; error: null; count: number | null }> {
  private filters: Array<[string, unknown]> = [];
  private sort?: { key: string; ascending: boolean };
  private take?: number;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private payload: Row | Row[] | undefined;
  private head = false;

  constructor(private table: string) {}

  select(_columns = "*", options?: { count?: "exact"; head?: boolean }) {
    if (this.action === "select") this.action = "select";
    this.head = Boolean(options?.head);
    return this;
  }

  eq(key: string, value: unknown) {
    this.filters.push([key, value]);
    return this;
  }

  gte(_key: string, _value: unknown) {
    return this;
  }

  order(key: string, options?: { ascending?: boolean }) {
    this.sort = { key, ascending: options?.ascending !== false };
    return this;
  }

  limit(value: number) {
    this.take = value;
    return this;
  }

  insert(payload: Row | Row[]) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  async maybeSingle() {
    const result = await this.execute();
    return { data: result.data?.[0] ?? null, error: null };
  }

  async single() {
    const result = await this.execute();
    return { data: result.data?.[0] ?? null, error: null };
  }

  then<TResult1 = { data: Row[] | null; error: null; count: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: Row[] | null;
          error: null;
          count: number | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    const db = readDb();
    const rows = db[this.table] ?? [];
    const matches = (row: Row) => this.filters.every(([key, value]) => row[key] === value);
    const selected = rows.filter(matches);

    if (this.action === "insert") {
      const user = getUser();
      const additions = (Array.isArray(this.payload) ? this.payload : [this.payload])
        .filter(Boolean)
        .map((row) => ({
          id: localId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user?.id,
          ...row,
        })) as Row[];
      db[this.table] = [...rows, ...additions];
      writeDb(db);
      return { data: additions, error: null, count: additions.length };
    }
    if (this.action === "update") {
      const updated = rows
        .filter(matches)
        .map((row) => ({ ...row, ...this.payload, updated_at: new Date().toISOString() }));
      db[this.table] = rows.map((row) =>
        matches(row) ? { ...row, ...this.payload, updated_at: new Date().toISOString() } : row,
      );
      writeDb(db);
      return { data: updated, error: null, count: updated.length };
    }
    if (this.action === "delete") {
      db[this.table] = rows.filter((row) => !matches(row));
      writeDb(db);
      return { data: selected, error: null, count: selected.length };
    }
    let data = [...selected];
    if (this.sort)
      data.sort(
        (a, b) =>
          String(a[this.sort!.key] ?? "").localeCompare(String(b[this.sort!.key] ?? "")) *
          (this.sort!.ascending ? 1 : -1),
      );
    if (this.take) data = data.slice(0, this.take);
    return { data: this.head ? null : data, error: null, count: selected.length };
  }
}

function createLocalSupabase() {
  return {
    auth: {
      getSession: async () => {
        const user = getUser();
        return { data: { session: user ? { access_token: "local-session", user } : null } };
      },
      getUser: async () => ({ data: { user: getUser() }, error: null }),
      signUp: async ({ email }: { email: string; password: string }) => {
        const user = { id: localId(), email, user_metadata: {} };
        setUser(user);
        const db = readDb();
        db.profiles = [
          ...(db.profiles ?? []),
          {
            id: user.id,
            email,
            display_name: email.split("@")[0],
            plan: "free",
            ai_messages_used: 0,
            ai_messages_limit: 9999,
          },
        ];
        writeDb(db);
        return { data: { user }, error: null };
      },
      signInWithPassword: async ({ email }: { email: string; password: string }) => {
        const db = readDb();
        const profile = (db.profiles ?? []).find((row) => row.email === email);
        const user = { id: String(profile?.id ?? localId()), email, user_metadata: {} };
        if (!profile) {
          db.profiles = [
            ...(db.profiles ?? []),
            {
              id: user.id,
              email,
              display_name: email.split("@")[0],
              plan: "free",
              ai_messages_used: 0,
              ai_messages_limit: 9999,
            },
          ];
          writeDb(db);
        }
        setUser(user);
        return { data: { user }, error: null };
      },
      signOut: async () => {
        setUser(null);
        return { error: null };
      },
      updateUser: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
    from: (table: string) => new LocalQuery(table),
    rpc: async () => ({ data: false, error: null }),
  };
}

export const supabase = createLocalSupabase() as unknown as SupabaseClient<Database>;
