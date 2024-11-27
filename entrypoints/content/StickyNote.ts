import {
  autoPlacement,
  autoUpdate,
  computePosition,
  inline,
} from "@floating-ui/dom";
import { debounce } from "./utils";
import { Note, NoteDB, updateNote } from "./database";
import { IDBPDatabase } from "idb";
import { BaseSearch } from "./BaseSearch";
import { SearchToken } from "./BaseSearch";
import { NodeMap } from "./types";

export class StickyNote extends BaseSearch {
  private id: `${string}-${string}-${string}-${string}-${string}`;
  private db: IDBPDatabase<NoteDB>;
  private nodeMap: NodeMap;
  private content: string;
  // todo probably save the note content too
  private url: string;
  private cleanUp: Function | undefined;

  constructor(
    root: HTMLElement,
    token: SearchToken,
    db: IDBPDatabase<NoteDB>,
    nodeMap: NodeMap,
    url: string,
    id = crypto.randomUUID(),
    content = "",
    defaultClassName = "highlight",
    defaultCaseSensitive = false
  ) {
    super(root, token, defaultClassName, defaultCaseSensitive);
    this.id = id;
    this.content = content;
    this.db = db;
    this.nodeMap = nodeMap;
    this.url = url;
  }

  protected wrapRange(range: Range, className: string): void {
    const marker = document.createElement("marker");
    marker.classList.add(className);
    marker.appendChild(range.extractContents());

    const noteContainer = this.createStickyNote(marker);

    document.body.appendChild(noteContainer);
    range.insertNode(marker);
    this.cleanUp = autoUpdate(marker, noteContainer, () => {
      computePosition(marker, noteContainer, {
        placement: "bottom-end",
        middleware: [inline()],
      }).then(({ x, y }) => {
        Object.assign(noteContainer.style, { left: `${x}px`, top: `${y}px` });
      });
    });
  }

  private createStickyNote(marker: HTMLElement): HTMLElement {
    const noteContainer = document.createElement("div");
    noteContainer.classList.add("stky-container");
    noteContainer.id = `${this.id}-note`;

    const noteContent = document.createElement("div");
    noteContent.classList.add("stky-content");

    const noteArea = document.createElement("textarea");
    noteArea.placeholder = "Type something here...";
    noteArea.classList.add("stky-note");
    noteArea.value = this.content;
    noteArea.addEventListener(
      "input",
      debounce(async (e) => {
        const inputEvent = e as InputEvent;
        const value = (e.target as HTMLTextAreaElement).value;
        const note: Note = this.getNoteObject(marker, value);
        try {
          await updateNote(this.db, note);
        } catch (error) {
          console.error("Failed to update note:", error);
        }
      }, 3000)
    );

    const operationsContainer = document.createElement("div");
    operationsContainer.classList.add("stky-operations");

    const shrinkButton = document.createElement("button");
    shrinkButton.classList.add("stky-button", "shrink");
    shrinkButton.setAttribute("data-icon", "shrink");
    shrinkButton.addEventListener("click", (e) => {
      e.stopPropagation();
      noteContainer.classList.add("stky-ball");
      noteContent.classList.add("hidden");

      noteContainer.addEventListener(
        "click",
        () => {
          noteContent.classList.remove("hidden");
          noteContainer.classList.remove("stky-ball");
        },
        { once: true }
      );
    });

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("stky-button", "delete");
    deleteButton.setAttribute("data-icon", "delete");
    deleteButton.addEventListener("click", () => {
      this.removeHighlight();
      const note = document.getElementById(`${this.id}-note`);
      note?.remove();
    });

    operationsContainer.appendChild(shrinkButton);
    operationsContainer.appendChild(deleteButton);

    noteContent.appendChild(noteArea);
    noteContent.appendChild(operationsContainer);

    noteContainer.appendChild(noteContent);
    return noteContainer;
  }

  getNoteObject(marker: HTMLElement, value: string) {
    return {
      id: this.id,
      nodeMap: this.nodeMap,
      content: value,
      highlighted: marker.textContent || "",
      url: this.url,
    };
  }
}
