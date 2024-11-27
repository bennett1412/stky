export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create(
      {
        id: "add-note",
        title: "Add a note",
        contexts: ["selection"],
      },
      () => {
        console.log("context menu created");
      }
    );
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
      case "add-note":
        if (tab) {
          console.log(info.selectionText);
          await getNoteLocation(info, tab);
        }
        break;
    }
    return true;
  });

  // might not need a promise here
  // how to know if adding a promise impacts perf 
  function getNoteLocation(
    info: chrome.contextMenus.OnClickData,
    tab: chrome.tabs.Tab
  ): Promise<void | null> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id!!, "getClickedEl", (data) => {
        if (data.value === null) {
          reject(null);
        }
        resolve();
      });
    });
  }
});
