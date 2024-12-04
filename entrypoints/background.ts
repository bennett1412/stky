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

    chrome.contextMenus.create({
      id: "translate-with-ai",
      title: "Translate with AI",
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
      // console.log("trying to translate");
      if (info.menuItemId === "add-note") {
        await insertNote(info, tab);
      } else if (info.menuItemId === "summarise-with-ai") {
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
      } else {
        console.log("trying to translate");
        let translatedText = "";
        console.log("sending selected text to translate");
        if ("translation" in self.ai && "create" in self.ai.translator) {
          const options = {
            sourceLanguage: "en",
            targetLanguage: "fr",
            monitor(m) {
              m.addEventListener("downloadprogress", (e) => {
                console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
              });
            },
          };

          let translator;
          const available = (await self.ai.translator.capabilities()).available;

          if (available === "no") {
            console.log("Translation API doesn't work");
          }

          if (available === "readily") {
            translator = await self.ai.translator.create(options);
          } else {
            translator = await self.ai.translator.create(options);
            // translator.
            // translator.addEventListener("downloadprogress", (e) => {
            //   console.log(e.loaded, e.total);
            // });
            // await translator.ready;
          }

          if (info.selectionText) {
            translatedText = await translator.translate(info.selectionText);
            insertNote(info, tab, translatedText);
          }
        } else {
          console.log("translation not available");
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

  let currentBadgeText = ""; // Store the current badge text globally

  // Listener for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateBadge") {
      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const activeTab = tabs[0];
          // Update badge text for the active tab
          chrome.action.setBadgeText({
            text: message.text,
            tabId: activeTab.id,
          });
          sendResponse({ status: "Badge updated" });
        } else {
          sendResponse({ status: "No active tab found" });
        }
      });
    } else if (message.action === "getBadge") {
      // Get the current active tab's badge text
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const activeTab = tabs[0];
          chrome.action.getBadgeText({ tabId: activeTab.id }, (text) => {
            sendResponse({ text: text });
          });
        } else {
          sendResponse({ status: "No active tab found" });
        }
      });
    }
    // Return true to indicate we are using sendResponse asynchronously
    return true;
  });
});
