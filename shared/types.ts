import { DBSchema, IDBPDatabase } from "idb";

export type NodeMap = {
  rootId: string;
  map: string;
};

export type randomUUIDType =
  `${string}-${string}-${string}-${string}-${string}`;

export interface SearchTokenInterface {
  text: string;
  className?: string;
  caseSensitive?: boolean;
}
export interface Note {
  id: randomUUIDType;
  content: string;
  nodeMap: NodeMap;
  highlighted: string;
  url: string;
  hide: boolean;
}
export interface NoteDB extends DBSchema {
  notes: {
    value: Note;
    key: string;
    // indexes: { "": number };
  };
}
export type StickyNoteParams = {
  root: HTMLElement;
  token: SearchTokenInterface;
  db: IDBPDatabase<NoteDB>;
  nodeMap: NodeMap;
  url: string;
  hide?: boolean;
  id?: randomUUIDType;
  content?: string;
  defaultClassName?: string;
  defaultCaseSensitive?: boolean;
};
