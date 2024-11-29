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

    chrome.contextMenus.create({
      id: "summarise-with-ai",
      title: "Summary with AI",
      contexts: ["selection"],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // switch (info.menuItemId) {
    //   case "add-note":
    //     if (tab) {
    //       console.log(info.selectionText);
    //       await insertNote(info, tab);
    //     }
    //     break;
    //   case "summarise-with-ai":
    //     if (tab) {
    //       console.log(info.selectionText);
    //       await insertNote(info, tab);
    //     }
    // }

    if (tab) {
      if (info.menuItemId === "add-note") {
        await insertNote(info, tab);
      } else {
        let summary = "";
        console.log("sending selected text to content");
        if ("ai" in self && "summarizer" in self.ai) {
          const options: AISummarizerCreateOptions = {
            type: "tl;dr",
            format: "plain-text",
            length: "short",
            monitor(m) {
              m.addEventListener("downloadprogress", (e) => {
                console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
              });
            },
          };
          let summarizer;
          const available = (await self.ai.summarizer.capabilities()).available;
          if (available === "no") {
            console.log("summariser api doesn't work");
          }
          if (available === "readily") {
            // The Summarizer API can be used immediately .
            summarizer = await self.ai.summarizer.create(options);
          } else {
            // The Summarizer API can be used after the model is downloaded.
            summarizer = await self.ai.summarizer.create(options);
            summarizer.addEventListener("downloadprogress", (e) => {
              console.log(e.loaded, e.total);
            });
            await summarizer.ready;
          }
          if (info.selectionText) {
            summary = await summarizer.summarize(info.selectionText, {
              context: "Briefly explain what is happening in this text.",
            });
            insertNote(info, tab, summary);
          }
        } else {
          console.log("no ai");
        }
      }
    }

    // for async processes
    return true;
  });

  // might not need a promise here
  // how to know if adding a promise impacts perf
  function insertNote(
    info: chrome.contextMenus.OnClickData,
    tab: chrome.tabs.Tab,
    summary = ""
  ): Promise<void | null> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id!!, summary, (data) => {
        if (data.value === null) {
          reject(null);
        }
        resolve();
      });
    });
  }
});
