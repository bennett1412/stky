import { SearchToken } from "./BaseSearch";
import { getAllNotes, getDB } from "./database";
import { StickyNote } from "./StickyNote";
import { isSubString } from "./utils";

export const insertSavedNotes = async () => {
  const db = await getDB();
  const notes = await getAllNotes(db);
  const noteList = [];
  for (let note of notes) {
    if (!isSubString(document.URL, note.url)) continue;
    const rootId = note.nodeMap.rootId;
    let tagMap = note.nodeMap.map
      .split(";")
      .filter((tagName) => tagName !== "")
      .map((tagName) => tagName.toLowerCase());
    console.log(tagMap);
    const selector = tagMap.join(" > ");
    const rootNode =
      document.getElementById(rootId.toString()) ?? document.getRootNode();
    console.log("look here", rootNode);
    const candidateNodes = document.querySelectorAll(selector);
    // console.log(selector, candidateNodes);
    if (candidateNodes.length > 0) {
      for (let i = 0; i < candidateNodes.length; i++) {
        const node = candidateNodes[i];
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).innerText.includes(note.highlighted)
        ) {
          console.log(
            "this is what re-insertion gets: ",
            node,
            node.parentNode
          );
          const s = new StickyNote({
            root: node as HTMLElement,
            token: new SearchToken(note.highlighted, "stky-highlight"),
            db,
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
    console.log(note.highlighted);
  }
};
