"use client";

import {
  createContext,
  useContext,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, type EditorSettings } from "./types";

export interface EditorState {
  settings: EditorSettings;
  videoFile: File | null;
  videoUrl: string | null;
  videoDuration: number;
  videoWidth: number;
  videoHeight: number;
  frames: string[];
  frameRows: number;
  currentFrame: number;
  isPlaying: boolean;
  isProcessing: boolean;
  processProgress: number;
  inPoint: number;
  outPoint: number;
  crossfadeFrames: number;
  loopEnabled: boolean;
}

export type EditorAction =
  | { type: "SET_SETTINGS"; payload: Partial<EditorSettings> }
  | {
      type: "SET_VIDEO";
      payload: {
        file: File;
        url: string;
        duration: number;
        width: number;
        height: number;
      };
    }
  | { type: "CLEAR_VIDEO" }
  | { type: "SET_FRAMES"; payload: { frames: string[]; rows: number } }
  | { type: "SET_CURRENT_FRAME"; payload: number }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "SET_IN_POINT"; payload: number }
  | { type: "SET_OUT_POINT"; payload: number }
  | { type: "SET_CROSSFADE"; payload: number }
  | { type: "SET_LOOP"; payload: boolean };

const initialState: EditorState = {
  settings: DEFAULT_SETTINGS,
  videoFile: null,
  videoUrl: null,
  videoDuration: 0,
  videoWidth: 0,
  videoHeight: 0,
  frames: [],
  frameRows: 0,
  currentFrame: 0,
  isPlaying: false,
  isProcessing: false,
  processProgress: 0,
  inPoint: 0,
  outPoint: 0,
  crossfadeFrames: 0,
  loopEnabled: true,
};

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case "SET_VIDEO":
      return {
        ...state,
        videoFile: action.payload.file,
        videoUrl: action.payload.url,
        videoDuration: action.payload.duration,
        videoWidth: action.payload.width,
        videoHeight: action.payload.height,
        frames: [],
        frameRows: 0,
        currentFrame: 0,
        inPoint: 0,
        outPoint: action.payload.duration,
      };
    case "CLEAR_VIDEO":
      if (state.videoUrl) {
        URL.revokeObjectURL(state.videoUrl);
      }
      return {
        ...state,
        videoFile: null,
        videoUrl: null,
        videoDuration: 0,
        videoWidth: 0,
        videoHeight: 0,
        frames: [],
        frameRows: 0,
        currentFrame: 0,
        isPlaying: false,
        isProcessing: false,
        processProgress: 0,
        inPoint: 0,
        outPoint: 0,
      };
    case "SET_FRAMES":
      return {
        ...state,
        frames: action.payload.frames,
        frameRows: action.payload.rows,
        currentFrame: 0,
      };
    case "SET_CURRENT_FRAME":
      return { ...state, currentFrame: action.payload };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.payload };
    case "SET_PROGRESS":
      return { ...state, processProgress: action.payload };
    case "SET_IN_POINT":
      return { ...state, inPoint: action.payload };
    case "SET_OUT_POINT":
      return { ...state, outPoint: action.payload };
    case "SET_CROSSFADE":
      return { ...state, crossfadeFrames: action.payload };
    case "SET_LOOP":
      return { ...state, loopEnabled: action.payload };
    default:
      return state;
  }
}

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <EditorContext.Provider value={{ state, dispatch, videoRef }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return ctx;
}
