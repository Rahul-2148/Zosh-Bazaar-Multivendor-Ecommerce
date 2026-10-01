import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ExecutionStep,
  StructuredComparison,
  ActionPayload,
} from "../../../services/aiCommerceService";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  suggestedProducts?: any[];
  suggestedActions?: string[];
  executionSteps?: ExecutionStep[];
  structuredComparison?: StructuredComparison;
  actionPayloads?: ActionPayload[];
  isStreaming?: boolean;
}

export interface AIAssistantContext {
  pageType?: "pdp" | "cart" | "wishlist" | "orders" | "search" | "home" | "general";
  currentProductId?: string;
  currentProductTitle?: string;
  currentProductPrice?: number;
  currentProductBrand?: string;
  currentProductCategory?: string;
  cartProductIds?: string[];
  cartCount?: number;
  cartTotal?: number;
  orderId?: string;
  searchQuery?: string;
  budget?: number;
  maxBudget?: number;
  brand?: string;
  color?: string;
  category?: string;
  featureFocus?: string;
  [key: string]: any;
}

interface AIAssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  mode: "panel" | "sheet" | "modal";
  activeContext: AIAssistantContext;
  messages: ChatMessage[];
  loading: boolean;
  isStreaming: boolean;
  activeExecutionSteps: ExecutionStep[];
}

const initialWelcomeMessage: ChatMessage = {
  id: "msg_init",
  role: "assistant",
  content:
    "### Welcome to Zosh Bazaar AI 👋\n\nI am your **Personal Shopping Assistant**! I can help you find products within your budget, compare specifications side-by-side, track active shipments, and answer questions about returns and deals.\n\n**Tap any topic below to get started or ask me anything:**",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  suggestedActions: [
    "🔥 Today's Best Deals",
    "👟 Trending Sneakers",
    "📦 Where is my order?",
    "🔄 Return policy",
  ],
};

const initialState: AIAssistantState = {
  isOpen: false,
  isMinimized: false,
  mode: "panel",
  activeContext: {},
  messages: [initialWelcomeMessage],
  loading: false,
  isStreaming: false,
  activeExecutionSteps: [],
};

export const aiAssistantSlice = createSlice({
  name: "aiAssistant",
  initialState,
  reducers: {
    openAssistant: (
      state,
      action: PayloadAction<{
        context?: AIAssistantContext;
        initialMessage?: string;
      } | undefined>
    ) => {
      state.isOpen = true;
      state.isMinimized = false;
      if (action?.payload?.context) {
        state.activeContext = {
          ...state.activeContext,
          ...action.payload.context,
        };
      }
    },
    closeAssistant: (state) => {
      state.isOpen = false;
    },
    toggleAssistant: (state) => {
      state.isOpen = !state.isOpen;
      if (state.isOpen) {
        state.isMinimized = false;
      }
    },
    setMinimized: (state, action: PayloadAction<boolean>) => {
      state.isMinimized = action.payload;
    },
    setMode: (state, action: PayloadAction<"panel" | "sheet" | "modal">) => {
      state.mode = action.payload;
    },
    setActiveContext: (state, action: PayloadAction<AIAssistantContext>) => {
      state.activeContext = {
        ...state.activeContext,
        ...action.payload,
      };
    },
    clearActiveContext: (state) => {
      state.activeContext = {};
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    updateLastAssistantMessage: (state, action: PayloadAction<Partial<ChatMessage>>) => {
      const lastIndex = state.messages.length - 1;
      if (lastIndex >= 0 && state.messages[lastIndex].role === "assistant") {
        state.messages[lastIndex] = {
          ...state.messages[lastIndex],
          ...action.payload,
        };
      }
    },
    appendToLastAssistantContent: (state, action: PayloadAction<string>) => {
      const lastIndex = state.messages.length - 1;
      if (lastIndex >= 0 && state.messages[lastIndex].role === "assistant") {
        state.messages[lastIndex].content += action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setIsStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    setActiveExecutionSteps: (state, action: PayloadAction<ExecutionStep[]>) => {
      state.activeExecutionSteps = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [initialWelcomeMessage];
      state.activeContext = {};
      state.activeExecutionSteps = [];
    },
  },
});

export const {
  openAssistant,
  closeAssistant,
  toggleAssistant,
  setMinimized,
  setMode,
  setActiveContext,
  clearActiveContext,
  addMessage,
  updateLastAssistantMessage,
  appendToLastAssistantContent,
  setLoading,
  setIsStreaming,
  setActiveExecutionSteps,
  clearMessages,
} = aiAssistantSlice.actions;

export default aiAssistantSlice.reducer;
