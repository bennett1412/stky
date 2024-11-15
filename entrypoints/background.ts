export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create(
      {
        id: "add-note",
        title: "Add a note",
        contexts: ["selection"],
      },
      () => {
        console.log('context menu created')
      },
    );
  })
  
  
  // chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  
  // })
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  
    switch (info.menuItemId) {
      case "add-note":
        if(tab){
        console.log(info.selectionText);
        const res = await getNoteLocation(info, tab)
        if(res){
        const id = res.rootId;
        }
        }
        // save the node to indexdb
  
  
  
        break;
    }
    return true;
  });
  
  function getNoteLocation(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab): Promise<{rootId: string} | null> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id!!, "getClickedEl", data => {
        if (data.value === null) {
          reject(null)
        }
        // console.log(data)
        resolve(data.value)
      });
    });
  }
  
  function notifySaveSuccessful(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id!!, "noteSaved", data => {
        resolve(true)
      })
    })
  }
  
  function addNote(tab: chrome.tabs.Tab) {
    // new Promise((resolve, reject) => {
    //       chrome.tabs.sendMessage(tab.id, {
    //         type: "insertNote",
    //         map: "DIV;P;",
    //         id: "mw-content-text"
    //       }, (data) => {
    //         resolve(data)
    //       })
    //     }).then(data => console.log('added note'))
  
    return true
  }
});
