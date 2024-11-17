import "./styles.css"; 
import { SearchToken, InstantSearch } from "./InstantSearch";
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

    const normalizeSpaces = (text: string): string => {
      return text.replace(/[\s\u00A0]+/g, " ");
    };
    const insertNote = (root: HTMLElement | null) => {
      if (root === null) {
        return;
      }
      const searchToken = normalizeSpaces(
        window.getSelection()?.toString() || ""
      );
      window.getSelection()?.empty()
      const tokenInstance = new SearchToken(searchToken, "stky-highlight");
      const search = new InstantSearch(root, tokenInstance);
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
          if (id !== "" && id !== undefined) {
            break;
          }

          map = currentNode.tagName + ";" + map;
          currentNode = currentNode.parentElement;
        }

        console.log(id + map);
        const nodeMap = {
          rootId: id,
          map: map,
          // Add any other relevant properties
        };
        sendResponse({ value: nodeMap });
        insertNote(clickedEl);
        return true;
      }
    });
  },
});
