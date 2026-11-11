"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useReducer,
} from "react";

import type {
  CanvasCommandMenuState,
  CanvasComposerContext,
  CanvasEdge,
  CanvasGraph,
  CanvasNode,
  CanvasSelectionState,
  CanvasViewportState,
} from "./canvas-types";

type CanvasGraphAction =
  | { type: "set-graph"; graph: CanvasGraph }
  | { type: "set-nodes"; nodes: CanvasNode[] }
  | { type: "add-node"; node: CanvasNode }
  | { type: "update-node"; nodeId: string; updater: (node: CanvasNode) => CanvasNode }
  | { type: "remove-node"; nodeId: string }
  | { type: "set-edges"; edges: CanvasEdge[] }
  | { type: "add-edge"; edge: CanvasEdge }
  | { type: "remove-edge"; edgeId: string }
  | { type: "set-viewport"; viewport: CanvasViewportState }
  | { type: "set-selection"; selection: CanvasSelectionState }
  | { type: "set-composer"; composer: CanvasComposerContext }
  | { type: "set-command-menu"; commandMenu: CanvasCommandMenuState };

function canvasGraphReducer(state: CanvasGraph, action: CanvasGraphAction): CanvasGraph {
  switch (action.type) {
    case "set-graph":
      return action.graph;
    case "set-nodes":
      return { ...state, nodes: action.nodes };
    case "add-node":
      return { ...state, nodes: [...state.nodes, action.node] };
    case "update-node":
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.nodeId ? action.updater(node) : node,
        ),
      };
    case "remove-node":
      return {
        ...state,
        nodes: state.nodes.filter((node) => node.id !== action.nodeId),
        edges: state.edges.filter(
          (edge) => edge.source !== action.nodeId && edge.target !== action.nodeId,
        ),
        selection: {
          nodeId:
            state.selection.nodeId === action.nodeId ? null : state.selection.nodeId,
          edgeId: state.selection.edgeId,
        },
      };
    case "set-edges":
      return { ...state, edges: action.edges };
    case "add-edge":
      return { ...state, edges: [...state.edges, action.edge] };
    case "remove-edge":
      return {
        ...state,
        edges: state.edges.filter((edge) => edge.id !== action.edgeId),
      };
    case "set-viewport":
      return { ...state, viewport: action.viewport };
    case "set-selection":
      return {
        ...state,
        selection: action.selection,
        composer: {
          ...state.composer,
          nodeId: action.selection.nodeId,
        },
      };
    case "set-composer":
      return { ...state, composer: action.composer };
    case "set-command-menu":
      return { ...state, commandMenu: action.commandMenu };
    default:
      return state;
  }
}

type CanvasGraphStore = {
  state: CanvasGraph;
  setGraph: (graph: CanvasGraph) => void;
  setNodes: (nodes: CanvasNode[]) => void;
  addNode: (node: CanvasNode) => void;
  updateNode: (nodeId: string, updater: (node: CanvasNode) => CanvasNode) => void;
  removeNode: (nodeId: string) => void;
  setEdges: (edges: CanvasEdge[]) => void;
  addEdge: (edge: CanvasEdge) => void;
  removeEdge: (edgeId: string) => void;
  setViewport: (viewport: CanvasViewportState) => void;
  setSelection: (selection: CanvasSelectionState) => void;
  setComposer: (composer: CanvasComposerContext) => void;
  setCommandMenu: (commandMenu: CanvasCommandMenuState) => void;
};

const CanvasGraphContext = createContext<CanvasGraphStore | null>(null);

export function CanvasGraphProvider({
  initialGraph,
  children,
}: PropsWithChildren<{ initialGraph: CanvasGraph }>) {
  const [state, dispatch] = useReducer(canvasGraphReducer, initialGraph);

  const store = useMemo<CanvasGraphStore>(
    () => ({
      state,
      setGraph: (graph) => dispatch({ type: "set-graph", graph }),
      setNodes: (nodes) => dispatch({ type: "set-nodes", nodes }),
      addNode: (node) => dispatch({ type: "add-node", node }),
      updateNode: (nodeId, updater) =>
        dispatch({ type: "update-node", nodeId, updater }),
      removeNode: (nodeId) => dispatch({ type: "remove-node", nodeId }),
      setEdges: (edges) => dispatch({ type: "set-edges", edges }),
      addEdge: (edge) => dispatch({ type: "add-edge", edge }),
      removeEdge: (edgeId) => dispatch({ type: "remove-edge", edgeId }),
      setViewport: (viewport) => dispatch({ type: "set-viewport", viewport }),
      setSelection: (selection) => dispatch({ type: "set-selection", selection }),
      setComposer: (composer) => dispatch({ type: "set-composer", composer }),
      setCommandMenu: (commandMenu) =>
        dispatch({ type: "set-command-menu", commandMenu }),
    }),
    [state],
  );

  return (
    <CanvasGraphContext.Provider value={store}>
      {children}
    </CanvasGraphContext.Provider>
  );
}

export function useCanvasGraphStore() {
  const store = useContext(CanvasGraphContext);
  if (!store) {
    throw new Error("CanvasGraphProvider is missing");
  }
  return store;
}
