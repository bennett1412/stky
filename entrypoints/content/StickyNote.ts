import { autoUpdate, computePosition, inline } from "@floating-ui/dom";
import { debounce } from "./utils";
import { Note, NoteDB, updateNote } from "./database";
import { IDBPDatabase } from "idb";
import { BaseSearch } from "./BaseSearch";
import { SearchToken } from "./BaseSearch";

export class StickyNote extends BaseSearch {
  private id: string;
  private db: IDBPDatabase<NoteDB>;
  private cleanUp: Function | undefined;

  constructor(
    root: HTMLElement,
    token: SearchToken,
    db: IDBPDatabase<NoteDB>,
    defaultClassName = "highlight",
    defaultCaseSensitive = false
  ) {
    super(root, token, defaultClassName, defaultCaseSensitive);
    this.id = crypto.randomUUID();
    this.db = db;
  }

  protected wrapRange(range: Range, className: string): void {
    const marker = document.createElement("marker");
    marker.classList.add(className);
    marker.appendChild(range.extractContents());

    const noteContainer = this.createStickyNote(marker);

    document.body.appendChild(noteContainer);
    range.insertNode(marker);
    this.cleanUp = autoUpdate(marker, noteContainer, () => {
      computePosition(marker, noteContainer, { middleware: [inline()] }).then(
        ({ x, y }) => {
          Object.assign(noteContainer.style, { left: `${x}px`, top: `${y}px` });
        }
      );
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

    noteArea.addEventListener(
      "input",
      debounce((e) => {
        const inputEvent = e as InputEvent;
        const value = (e.target as HTMLTextAreaElement).value;
        const note: Note = {
          id: this.id,
          nodeMap: "",
          content: value,
          highlighted: marker.textContent || "",
        };
        updateNote(this.db, note);
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
          noteContainer.classList.remove("stky-ball");
          noteContent.classList.remove("hidden");
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
}
