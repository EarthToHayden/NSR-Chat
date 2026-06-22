const MIGRATIONS = [
    {
        id: 1,
        sql: `
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        `,
    },
    {
        id: 2,
        sql: `
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            );
        `,
    },
]

export function runMigrations(db) {
    const row = db.prepare('PRAGMA user_version').get()
    const currentVersion = Number(row?.user_version ?? 0)

    for (const migration of MIGRATIONS) {
        if (migration.id <= currentVersion) continue

        db.exec('BEGIN;')
        try {
            db.exec(migration.sql)
            db.exec(`PRAGMA user_version = ${migration.id};`)
            db.exec('COMMIT;')
        } catch (err) {
            db.exec('ROLLBACK;')
            throw err
        }
    }
}