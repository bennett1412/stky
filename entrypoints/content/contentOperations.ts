import { SearchToken } from "./BaseSearch";
import { getAllNotes, getDB } from "./database";
import { StickyNote } from "./StickyNote";
import { isSubString, isUrlSuperstring } from "./utils";

export const insertSavedNotes = async () => {
  const db = await getDB();
  const notes = await getAllNotes(db);
  const noteList = [];
  for (let note of notes) {
    if (!isSubString(document.URL, note.url)) continue;
    const rootId = note.nodeMap.rootId;
    const tagMap = note.nodeMap.map
      .split(";")
      .filter((tagName) => tagName !== "")
      .map((tagName) => tagName.toLowerCase());
    console.log(tagMap);
    const selector = tagMap.join(" > ");
    const rootNode = document.getElementById(rootId.toString());
    const candidateNodes = document.querySelectorAll(selector);
    console.log(selector, candidateNodes);
    if (candidateNodes.length > 0) {
      for (let node of candidateNodes) {
        const s = new StickyNote(
          node as HTMLElement,
          new SearchToken(note.highlighted, "stky-highlight"),
          db,
          note.nodeMap,
          note.url,
          note.id,
          note.content
        );
        if (s.highlight()) {
          noteList.push(s);
          break;
        }
      }
    }
  }
};
