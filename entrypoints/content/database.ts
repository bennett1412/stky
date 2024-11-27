import { openDB, DBSchema, IDBPDatabase } from "idb";
import { NodeMap } from "./types";
export interface Note {
  id: `${string}-${string}-${string}-${string}-${string}`;
  content: string;
  nodeMap: NodeMap;
  highlighted: string;
  url: string;
}
export interface NoteDB extends DBSchema {
  notes: {
    value: Note;
    key: string;
    // indexes: { "": number };
  };
}

export async function getDB() {
  const db = await openDB<NoteDB>("note-db", 1, {
    upgrade(db) {
      db.createObjectStore("notes", {
        keyPath: "id",
      });
    },
  });

  return db;
}

// function to add a note
export async function addNote(db: IDBPDatabase<NoteDB>, note: Note) {
  await db.add("notes", note);
}

// function to update a note
export async function updateNote(db: IDBPDatabase<NoteDB>, note: Note) {
  await db.put("notes", note);
}

// function to delete a note
export async function deleteNote(db: IDBPDatabase<NoteDB>, note: Note) {
  await db.add("notes", note);
}

// function to get all notes
export async function getAllNotes(db: IDBPDatabase<NoteDB>) {
  const notes = await db.getAll("notes");
  return notes;
}
