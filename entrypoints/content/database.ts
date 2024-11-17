import { openDB, DBSchema } from "idb";

interface NoteDB extends DBSchema {
  notes: {
    value: {
      content: string;
      nodeMap: string;
      highlighted: string;
      id: string;
    };
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

// function to update a note 

// function to delete a note 
