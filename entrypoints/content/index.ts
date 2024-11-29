import "./styles.css";
import { getDB } from "./database";
import { StickyNote } from "./StickyNote";
import { NodeMap } from "./types";
import { insertSavedNotes } from "./contentOperations";
import { SearchToken } from "./BaseSearch";
export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx) {
    // let shadowContainer: HTMLElement | null = null;
    // const ui = await createShadowRootUi(ctx, {
    //   name: "stky-ui",
    //   position: "inline",
    //   anchor: "body",
    //   isolateEvents: true,
    //   onMount(container) {
    //     console.log('mounting shadow')
    //     shadowContainer = container;
    //   },
    // });

    // 4. Mount the UI
    // ui.mount();

    // todo: get uninsertedNotes back and put them somewhere on the screen
    // const uninsertedNote = insertSavedNotes();

    insertSavedNotes();
    const normalizeSpaces = (text: string): string => {
      return text
          .replace(/[\r\n]+/g, " ") 
          .replace(/[\s\u00A0]+/g, " ") 
          .trim(); 
  };
    const insertNote = async (
      root: HTMLElement | null,
      nodeMap: NodeMap,
      summary: string
    ) => {
      if (root === null) {
        return;
      }
      const searchToken = normalizeSpaces(
        window.getSelection()?.toString() || ""
      );
      console.log(window.getSelection(), window.getSelection()?.toString().includes('\n'));
      const tokenInstance = new SearchToken(searchToken, "stky-highlight");
      const db = await getDB();
      const urlObj = new URL(document.URL);
      const baseURL = `${urlObj.origin}${urlObj.pathname}`;
      console.log("this is what insertion gets:", root);
      const search = new StickyNote({
        root,
        token: tokenInstance,
        db,
        nodeMap,
        url: baseURL,
        content: summary,
      });
      search.highlight();
    };

    var clickedEl: HTMLElement | null = null;
    document.addEventListener(
      "contextmenu",
      function (event) {
        clickedEl = event.target as HTMLElement;
      },
      true
    );

    chrome.runtime.onMessage.addListener(async function (
      message,
      sender,
      sendResponse
    ) {
      // clickedEl.style.color = "red"
      const summary = message;
      let currentNode = clickedEl;
      // let foundId = false;
      if (currentNode === null) {
        return;
      }
      let map = "";
      console.log("looking for id");
      let id = null;
      while (currentNode) {
        id = currentNode.id;
        if (id !== "" && id !== undefined && map.split(";").length > 15) {
          // length of map too long
          // or root id has been found
          break;
        }

        map = currentNode.tagName + ";" + map;
        currentNode = currentNode.parentElement;
      }

      console.log(id + map);
      if (id === null && map.split(";").length > 15) {
        // use popup for sticky note
      } else {
        // use floating sticky note
        const nodeMap = {
          rootId: id!!,
          map: map,
        };

        sendResponse({ error: null });
        insertNote(clickedEl, nodeMap, summary);
      }
      return true;
    });
  },
});
