import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export function createSqliteClient(dbPath) {
    mkdirSync(dirname(dbPath), { recursive: true})

    const db = new DatabaseSync(dbPath)
    db.exec('PRAGMA foreign_keys = ON;')
    
    return db
}