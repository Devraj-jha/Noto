import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface NotoDB extends DBSchema {
  notes: {
    key: string
    value: any
    indexes: { 'by-updated': number; 'by-created': number }
  }
  folders: {
    key: string
    value: any
  }
  meta: {
    key: string
    value: any
  }
}

let dbPromise: Promise<IDBPDatabase<NotoDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<NotoDB>('noto', 1, {
      upgrade(db) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' })
        noteStore.createIndex('by-updated', 'updatedAt')
        noteStore.createIndex('by-created', 'createdAt')
        db.createObjectStore('folders', { keyPath: 'id' })
        db.createObjectStore('meta', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

export async function putNote(note: any) {
  const db = await getDB()
  await db.put('notes', note)
}

export async function putManyNotes(notes: any[]) {
  const db = await getDB()
  const tx = db.transaction('notes', 'readwrite')
  for (const n of notes) tx.store.put(n)
  await tx.done
}

export async function getAllNotes(): Promise<any[]> {
  const db = await getDB()
  return db.getAll('notes')
}

export async function getAllFolders(): Promise<any[]> {
  const db = await getDB()
  return db.getAll('folders')
}

export async function getMeta(key: string): Promise<any | undefined> {
  const db = await getDB()
  const row = await db.get('meta', key)
  return row?.value
}

export async function setMeta(key: string, value: any) {
  const db = await getDB()
  await db.put('meta', { key, value })
}

export async function clearAll() {
  const db = await getDB()
  const tx = db.transaction(['notes', 'folders'], 'readwrite')
  await tx.objectStore('notes').clear()
  await tx.objectStore('folders').clear()
  await tx.done
}

export async function deleteNote(id: string) {
  const db = await getDB()
  await db.delete('notes', id)
}

export async function deleteFolder(id: string) {
  const db = await getDB()
  await db.delete('folders', id)
}

export async function putFolder(folder: any) {
  const db = await getDB()
  await db.put('folders', folder)
}

export async function putManyFolders(folders: any[]) {
  const db = await getDB()
  const tx = db.transaction('folders', 'readwrite')
  for (const f of folders) tx.store.put(f)
  await tx.done
}