import "./styles.css";
import { SearchToken, InstantSearch } from "./InstantSearch";
import { getDB } from "./database";
import { StickyNote } from "./StickyNote";
import { NodeMap } from "./types";
import { insertSavedNotes } from "./contentOperations";
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

    // // 4. Mount the UI
    // ui.mount();
    insertSavedNotes();
    const normalizeSpaces = (text: string): string => {
      return text.replace(/[\s\u00A0]+/g, " ");
    };
    const insertNote = async (root: HTMLElement | null, nodeMap: NodeMap) => {
      if (root === null) {
        return;
      }
      const searchToken = normalizeSpaces(
        window.getSelection()?.toString() || ""
      );
      window.getSelection()?.empty();
      const tokenInstance = new SearchToken(searchToken, "stky-highlight");
      const db = await getDB();
      const urlObj = new URL(document.URL);
      const baseURL = `${urlObj.origin}${urlObj.pathname}`;
      const search = new StickyNote(root, tokenInstance, db, nodeMap, baseURL);
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

    chrome.runtime.onMessage.addListener(function (
      message,
      sender,
      sendResponse
    ) {
      if (message == "getClickedEl") {
        // clickedEl.style.color = "red"
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
            break;
          }

          map = currentNode.tagName + ";" + map;
          currentNode = currentNode.parentElement;
        }

        console.log(id + map);
        if (id === null && map.split(";").length > 10) {
          // use popup for sticky note
        } else {
          // use floating sticky note
          const nodeMap = {
            rootId: id!!,
            map: map,
          };
          sendResponse({ error: null });
          insertNote(clickedEl, nodeMap);
        }
        return true;
      }
    });
  },
});
