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

export class BaseSearch {
  protected root: HTMLElement;
  protected token: SearchToken;
  protected matches: Match[];
  protected defaultClassName: string;
  protected defaultCaseSensitive: boolean;
  protected state: Record<string, any>;

  constructor(
    root: HTMLElement,
    token: SearchToken,
    defaultClassName = "highlight",
    defaultCaseSensitive = false
  ) {
    this.root = root;
    this.token = token;
    this.matches = [];
    this.defaultClassName = defaultClassName;
    this.defaultCaseSensitive = defaultCaseSensitive;
    this.state = {};
  }

  highlight(): boolean {
    this.matches = [];
    this.state[this.token.text] = {};
    if (this.token.text.length > 0) {
      this.walk(this.root);
      console.log(this.matches)
      if (this.matches.length === 0) return false;
      this.matches.reverse().forEach((m) => {
        const className = m.token.className || this.defaultClassName;
        const range = this.createRange(
          m.startNode,
          m.startOffset,
          m.endNode,
          m.endOffset
        );
        this.wrapRange(range, className);
      });
    }
    return true;
  }

  removeHighlight(): void {
    this.root
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
  }

  protected search(node: Node): void {
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

  protected transitionState(
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

  protected createRange(
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

  protected wrapRange(range: Range, className: string): void {
    const marker = document.createElement("marker");
    marker.classList.add(className);
    marker.appendChild(range.extractContents());
    range.insertNode(marker);
  }

  protected mergeAdjacentSimilarNodes(parent: HTMLElement | null): void {
    if (parent && parent.childNodes) {
      Array.from(parent.childNodes).reduce(
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

  protected resetState(state: any): void {
    delete state.current;
    delete state.startNode;
    delete state.startOffset;
  }

  protected walk(node: HTMLElement): void {
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
