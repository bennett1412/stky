import { autoUpdate, computePosition } from "@floating-ui/dom";

type StateTransitionType = {
  empty: number;
  valid: number;
  match: number;
};

const StateTransition: StateTransitionType = {
  empty: 0,
  valid: 1,
  match: 2,
};

interface SearchTokenInterface {
  text: string;
  className?: string;
  caseSensitive?: boolean;
}

export class SearchToken implements SearchTokenInterface {
  text: string;
  className: string;
  caseSensitive: boolean;

  constructor(text: string, className?: string, caseSensitive?: boolean) {
    this.text = text;
    this.className = className ?? "test";
    this.caseSensitive = caseSensitive ?? false;
  }
}

interface Match {
  token: SearchToken;
  startNode: Node;
  startOffset: number;
  endNode: Node;
  endOffset: number;
}

interface PerformanceMetrics {
  event: string;
  time: number;
}

export class InstantSearch {
  private state: Record<string, any>;
  private root: HTMLElement;
  private token: SearchToken;
  private scrollToResult: boolean;
  private defaultClassName: string;
  private defaultCaseSensitive: boolean;
  private matches: Match[];
  private perfs: PerformanceMetrics[];
  private cleanUp: Function | undefined;
  constructor(
    root: HTMLElement,
    token: SearchToken,
    scrollToResult = true,
    defaultClassName = "highlight",
    defaultCaseSensitive = false
  ) {
    this.state = {};
    this.root = root;
    this.token = token;
    this.scrollToResult = scrollToResult;
    this.defaultClassName = defaultClassName;
    this.defaultCaseSensitive = defaultCaseSensitive;
    this.matches = [];
    this.perfs = [];
  }

  highlight(): void {
    this.matches = [];
    this.state[this.token.text] = {};
    if (this.token.text.length > 0) {
      const t1 = performance.now();
      this.walk(this.root);
      const t2 = performance.now();
      this.perfs.push({ event: "Search text", time: t2 - t1 });

      const t3 = performance.now();
      this.matches.reverse().forEach((m) => {
        const className = m.token.className || this.defaultClassName;
        const range = this.createRange(
          m.startNode,
          m.startOffset,
          m.endNode,
          m.endOffset
        );
        this.wrapRange(range, className, m.startNode, m.endNode);
      });
      const t4 = performance.now();
      this.perfs.push({ event: "Highlight text", time: t4 - t3 });
    }
  }

  removeHighlight(): void {
    const t1 = performance.now();
    let element: HTMLElement | null | undefined;
    if (this.root instanceof HTMLElement) {
      element = this.root;
    } else if (this.root.parentElement) {
      element = this.root.parentElement;
    }

    element
      ?.querySelectorAll(`.${this.token.className || this.defaultClassName}`)
      .forEach((el) => {
        const fragment = document.createDocumentFragment();
        const childNodes = el.childNodes;
        fragment.append(...Array.from(childNodes));
        const parent = el.parentNode;
        parent?.replaceChild(fragment, el);
        parent?.normalize();
        this.mergeAdjacentSimilarNodes(parent as HTMLElement);
      });
    if (this.cleanUp) this.cleanUp();
    const t2 = performance.now();
    this.perfs.push({ event: "Remove highlights", time: t2 - t1 });
  }

  mergeAdjacentSimilarNodes(parent: HTMLElement | null): void {
    if (parent && parent.childNodes) {
      Array.from(parent?.childNodes).reduce(
        (acc: HTMLElement | undefined, val) => {
          if (val instanceof Element) {
            if (
              acc &&
              acc.tagName.toLowerCase() === val.tagName.toLowerCase()
            ) {
              acc.append(...Array.from(val.childNodes));
              parent.removeChild(val);
              acc && this.mergeAdjacentSimilarNodes(acc);
            } else {
              acc && this.mergeAdjacentSimilarNodes(acc);
              acc = val as HTMLElement;
            }
          } else {
            acc && this.mergeAdjacentSimilarNodes(acc);
            acc = undefined;
          }
          return acc;
        },
        undefined
      );
    }
  }

  search(node: Node): void {
    const text = node.textContent || "";
    const token = this.token;
    const state = this.state[token.text];
    const caseSensitive = token.caseSensitive || this.defaultCaseSensitive;
    const tokenStr = caseSensitive ? token.text : token.text.toLowerCase();

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = `${state.current || ""}${
        caseSensitive ? char : char.toLowerCase()
      }`.replace(/\s+/g, " ");

      if (next === tokenStr) {
        this.transitionState(StateTransition.match, state, node, i, next);
      } else {
        const pos = tokenStr.indexOf(next);
        if (pos === 0) {
          this.transitionState(StateTransition.valid, state, node, i, next);
        } else {
          this.transitionState(StateTransition.empty, state, node, i, next);
        }
      }
    }
  }

  transitionState(
    type: number,
    state: any,
    node: Node,
    index: number,
    next: string
  ): void {
    switch (type) {
      case StateTransition.empty:
        this.resetState(state);
        break;
      case StateTransition.valid:
        if (!state.current || state.current.length === 0) {
          state.startNode = node;
          state.startOffset = index;
        }
        state.current = next;
        break;
      case StateTransition.match: {
        const isSingleChar = this.token.text.length === 1;
        const startNode = isSingleChar ? node : state.startNode;
        const startOffset = isSingleChar ? index : state.startOffset;
        this.matches.push({
          token: this.token,
          startNode,
          startOffset,
          endNode: node,
          endOffset: index + 1,
        });
        this.resetState(state);
        break;
      }
      default:
        break;
    }
  }

  createRange(
    startNode: Node,
    startOffset: number,
    endNode: Node,
    endOffset: number
  ): Range {
    const range = new Range();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }

  wrapRange(
    range: Range,
    className: string,
    startNode: Node,
    endNode: Node
  ): void {
    const clonedStartNode = startNode.cloneNode(true);
    const clonedEndNode = endNode.cloneNode(true);
    const selectedText = range.extractContents();

    const marker = document.createElement("marker");
    marker.classList.add(className);
    marker.appendChild(selectedText);

    // container
    const noteContainer = document.createElement("div");
    noteContainer.classList.add("stky-container");

    // content
    const noteContent = document.createElement("div");
    noteContent.classList.add("stky-content");
    noteContainer.appendChild(noteContent);
    // textarea
    const noteArea = document.createElement("textarea");
    noteArea.placeholder = "Type something here...";
    noteArea.classList.add("stky-note");
    noteContent.appendChild(noteArea);

    const updatePosition = () => {
      computePosition(marker, noteContainer).then(({ x, y }) => {
        Object.assign(noteContainer.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    };

    // operations
    // toggle size
    const toggleSizeButton = document.createElement("button");
    toggleSizeButton.textContent = "Shrink";
    toggleSizeButton.addEventListener("click", (e) => {
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
    noteContent.appendChild(toggleSizeButton);

    document.body.appendChild(noteContainer);
    this.cleanUp = autoUpdate(marker, noteContainer, updatePosition, {
      elementResize: true
    });

    range.insertNode(marker);

    this.removeEmptyDirectSiblings(
      marker,
      clonedStartNode as Node,
      clonedEndNode as Node
    );
  }

  removeEmptyDirectSiblings(
    element: HTMLElement,
    clonedStartNode: Node,
    clonedEndNode: Node
  ): void {
    const remove = (element: Element | null, originalNode: Node) => {
      let keepRemoving = true;
      while (keepRemoving) {
        keepRemoving = this.removeEmptyElement(element, originalNode);
      }
    };
    remove(element.previousElementSibling, clonedStartNode);
    remove(element.nextElementSibling, clonedEndNode);
  }

  removeEmptyElement(element: Element | null, originalNode: Node): boolean {
    const isInOriginalNode = (element: Element): boolean =>
      originalNode.childNodes &&
      Array.from(originalNode.childNodes).some(
        (c) => c instanceof Element && c.outerHTML === element.outerHTML
      );

    if (element) {
      if (
        element.parentNode &&
        !isInOriginalNode(element) &&
        !element.textContent
      ) {
        element.parentNode.removeChild(element);
        return true;
      } else if (element.childNodes[0] === element.children[0]) {
        return this.removeEmptyElement(
          element.children[0] as Element,
          originalNode
        );
      }
    }
    return false;
  }

  resetState(state: any): void {
    delete state.current;
    delete state.startNode;
    delete state.startOffset;
  }

  walk(node: HTMLElement): void {
    let currentParent: HTMLElement | undefined = undefined;
    const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);

    while (treeWalker.nextNode()) {
      const current = treeWalker.currentNode;
      if (current.parentElement) {
        const parent = current.parentElement;
        const display = getComputedStyle(parent).display;
        if (
          !["", "contents", "inline", "inline-block"].includes(display) &&
          currentParent !== parent
        ) {
          this.resetState(this.state[this.token.text]);
          currentParent = parent;
        }
      }
      this.search(current);
    }
  }
}

// function findMatch(e: Event): void {
//   const root = document.getElementById("content");
//   if (!root) return;

//   const searchToken = normalizeSpaces(window.getSelection()?.toString() || "");
//   console.log(searchToken);

//   const instance = new InstantSearch(
//     root,
//     new SearchToken(searchToken, "highlight")
//   );
//   instance.removeHighlight();

//   if (searchToken) {
//     instance.highlight();
//   }
// }
