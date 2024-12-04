import {
  autoPlacement,
  autoUpdate,
  computePosition,
  inline,
} from "@floating-ui/dom";
import { debounce, getBadgeText, updateBadgeText } from "@/shared/utils";
import { deleteNote, updateNote } from "@/shared/database";
import { IDBPDatabase } from "idb";
import { BaseSearch } from "./BaseSearch";
import { SearchToken } from "./BaseSearch";
import {
  NodeMap,
  Note,
  NoteDB,
  randomUUIDType,
  StickyNoteParams,
} from "@/shared/types";

export class StickyNote extends BaseSearch {
  private id: randomUUIDType;
  private db: IDBPDatabase<NoteDB>;
  private nodeMap: NodeMap;
  private content: string;
  // todo probably save the note content too
  private url: string;
  private hide: boolean;
  private cleanUp: Function | undefined;

  constructor({
    root,
    token,
    db,
    nodeMap,
    hide,
    url,
    id,
    content,
    defaultClassName,
    defaultCaseSensitive,
  }: StickyNoteParams) {
    super(
      root,
      token,
      defaultClassName ?? "highlight",
      defaultCaseSensitive ?? false
    );
    this.id = id ?? crypto.randomUUID();
    this.content = content ?? "";
    this.db = db;
    this.nodeMap = nodeMap;
    this.url = url;
    this.hide = hide ?? false;
    // ! handle error here
    updateNote(this.db, this.getNoteObject());
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
    const hideNote = () => {
      this.hide = true;
      noteContainer.classList.add("stky-ball");
      noteContent.classList.add("hidden");
      updateNote(this.db, this.getNoteObject());
      noteContainer.addEventListener(
        "click",
        () => {
          noteContent.classList.remove("hidden");
          noteContainer.classList.remove("stky-ball");
          this.hide = false;
          updateNote(this.db, this.getNoteObject());
        },
        { once: true }
      );
    };

    if (this.hide) {
      hideNote();
    }
    const noteArea = document.createElement("textarea");
    noteArea.placeholder = "Type something here...";
    noteArea.classList.add("stky-note");
    noteArea.value = this.content;
    noteArea.addEventListener(
      "input",
      debounce(async (e) => {
        const inputEvent = e as InputEvent;
        const value = (e.target as HTMLTextAreaElement).value;
        const note: Note = this.getNoteObject(value);
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
      hideNote();
    });

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("stky-button", "delete");
    deleteButton.setAttribute("data-icon", "delete");
    deleteButton.addEventListener("click", async () => {
      this.removeHighlight();
      const note = document.getElementById(`${this.id}-note`);
      note?.remove();
      const noteCount = parseInt(await getBadgeText());

      (Number.isNaN(noteCount - 1) ? "" : noteCount + 1).toString()
      deleteNote(this.db, this.id);
    });

    operationsContainer.appendChild(shrinkButton);
    operationsContainer.appendChild(deleteButton);

    noteContent.appendChild(noteArea);
    noteContent.appendChild(operationsContainer);

    noteContainer.appendChild(noteContent);
    return noteContainer;
  }

  getNoteObject(value?: string) {
    return {
      id: this.id,
      nodeMap: this.nodeMap,
      content: value ?? this.content,
      highlighted: this.token.text,
      url: this.url,
      hide: this.hide,
    };
  }
}
