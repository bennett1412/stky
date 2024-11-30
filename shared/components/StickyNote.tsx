import React, { useEffect, useRef, useState } from "react";
import { debounce } from "../utils"; // Assuming lodash is available for debounce
import { deleteNote, updateNote } from "../database";
import { Note, StickyNoteParams } from "../types";
import '@/shared/styles.css'
interface StickyNoteComponentParams extends Omit<StickyNoteParams, 'root'>{
    updateList: (id: string) => void
}
const StickyNote = ({
  id,
  content,
  db,
  url,
  token,
  nodeMap,
  hide,
  updateList
}: StickyNoteComponentParams) => {
  const [isHidden, setIsHidden] = useState(false);
  const [noteContent, setNoteContent] = useState(content);
  const noteContainerRef = useRef(null);
  const markerRef = useRef(null);
  const getNoteState = () => {
    return {
      id: id!!,
      content: noteContent!!,
      nodeMap,
      highlighted: token.text,
      url,
      hide: hide ?? false,
    };
  };
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNoteContent(value);
    debounce(async (e) => {
      try {
        // todo: fix types here
        // * extend sticky notes with note type
        await updateNote(db, getNoteState());
      } catch (error) {
        console.error("Failed to update note:", error);
      }
    }, 3000);
  };

  const hideNote = async () => {
    setIsHidden(true);
    try {
      await updateNote(db, getNoteState());
    } catch (e) {
      console.log("cant save hide operation");
    }
  };

  const deleteNoteHandler = async () => {
    try {
      await deleteNote(db, id!!);
      updateList(id!!)
    } catch (e) {
      console.log("unable to delete note");
    }
  };
  return (
    <div
      ref={noteContainerRef}
      className={`stky-container ${isHidden ? "stky-ball" : ""}`}
    >
      <div className={`stky-content ${isHidden ? "hidden" : ""}`}>
        <textarea
          placeholder="Type something here..."
          className="stky-note"
          value={noteContent}
          onChange={handleInputChange}
        />
        <Operations onDelete={deleteNoteHandler} />
      </div>
      {/* You can add additional elements or handlers here */}
    </div>
  );
};

const Operations = ({ onDelete }: { onDelete: () => void }) => (
  <div className="stky-operations">
    <button className="stky-button delete" onClick={onDelete}>
      Delete
    </button>
  </div>
);



export default StickyNote;
