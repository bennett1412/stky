import { SearchToken } from "./BaseSearch";
import { getAllNotes, getDB } from "../../shared/database";
import { StickyNote } from "./StickyNote";
import { isSubString, updateBadgeText } from "../../shared/utils";

export const insertSavedNotes = async () => {
  const db = await getDB();
  const notes = (await getAllNotes(db)).filter((note) =>
    isSubString(document.URL, note.url)
  );
  const noteList = [];

  updateBadgeText(notes.length.toString());
  for (let note of notes) {
    const rootId = note.nodeMap.rootId;
    let tagMap = note.nodeMap.map
      .split(";")
      .filter((tagName) => tagName !== "")
      .map((tagName) => tagName.toLowerCase());
    const selector = tagMap.join(" > ");

    const rootNode =
      document.getElementById(rootId.toString()) ?? document.getRootNode();

    const candidateNodes = document.querySelectorAll(selector);
    if (candidateNodes.length > 0) {
      for (let i = 0; i < candidateNodes.length; i++) {
        const node = candidateNodes[i];
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).innerText.includes(note.highlighted)
        ) {
          const s = new StickyNote({
            root: node as HTMLElement,
            token: new SearchToken(note.highlighted, "stky-highlight"),
            db,
            hide: note.hide,
            nodeMap: note.nodeMap,
            url: note.url,
            id: note.id,
            content: note.content,
          });
          if (s.highlight()) {
            noteList.push(s);
            break;
          }
        }
      }
    }
  }
};
