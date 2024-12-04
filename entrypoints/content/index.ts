import "../../shared/styles.css";
import { getDB } from "../../shared/database";
import { StickyNote } from "./StickyNote";
import { NodeMap } from "../../shared/types";
import { insertSavedNotes } from "./contentOperations";
import { SearchToken } from "./BaseSearch";
import { getBadgeText, updateBadgeText } from "@/shared/utils";
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

      // remove selection
      const selection = window.getSelection();
      if (selection) {
        if (selection.empty) {
          // Chrome-specific
          selection.empty();
        } else if (selection.removeAllRanges) {
          // Firefox
          selection.removeAllRanges();
        }
      }

      const tokenInstance = new SearchToken(searchToken, "stky-highlight");
      const db = await getDB();
      const urlObj = new URL(document.URL);
      const baseURL = `${urlObj.origin}${urlObj.pathname}`;
      const search = new StickyNote({
        root,
        token: tokenInstance,
        db,
        nodeMap,
        url: baseURL,
        content: summary,
      });
      search.highlight();
      const noteCount = parseInt(await getBadgeText());

      updateBadgeText(
        (Number.isNaN(noteCount + 1) ? "" : noteCount + 1).toString()
      );
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
      let id = null;
      while (currentNode) {
        id = currentNode.id;
        if (id !== "" && id !== undefined && map.split(";").length > 0) {
          // length of map too long
          // or root id has been found
          break;
        }

        map = currentNode.tagName + ";" + map;
        currentNode = currentNode.parentElement;
      }

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
