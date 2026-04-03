# PPT Auto-Generation Web System - Agent Prompt Design

## 1. Overview

### 1.1 Design Principles

- **Model-agnostic**: All prompts use OpenAI-compatible API format, supporting DeepSeek, Qwen, GPT, etc.
- **Language**: All system prompts written in English
- **Output**: All agents wrap output in a standard envelope and output structured JSON validated against JSON Schema
- **ReAct pattern**: Each agent follows Thought → Action → Observation loops

### 1.2 Common Prompt Structure

Every agent prompt follows this template:

```
[System Prompt]
	- Role definition
	- Task description
	- Output JSON schema
	- Constraints and rules
	- Few-shot examples (optional)

[User Prompt]
	- Current context
	- Input data
	- Specific instructions
```

### 1.3 Common Output Envelope

All agents wrap output in a standard envelope:

```json
{
	"agent": "AgentName",
	"status": "success | needs_revision | failed",
	"result": { ... },
	"reasoning": "Brief explanation of the decision",
	"revisionRequest": null
}
```

When `status` = `needs_revision`:

```json
{
	"agent": "LayoutSelectorAgent",
	"status": "needs_revision",
	"result": null,
	"reasoning": "Slide 3 content exceeds template capacity",
	"revisionRequest": {
		"targetAgent": "ContentWriterAgent",
		"slideIndex": 2,
		"instruction": "Reduce body text to under 120 characters"
	}
}
```

---

## 2. Agent Prompts

### 2.1 OrchestratorAgent

**Role**: Pipeline coordinator. Dispatches tasks, manages state, handles retries.

> This agent is implemented in code, not via LLM calls. It uses a state machine to orchestrate the pipeline. No prompt needed.

**State Machine**:

```
INIT → EXTRACTING → PLANNING → WAITING_CONFIRM → WRITING → LAYOUT → VISUAL → REVIEWING → DONE
																																										↓
																																							(revision loop)
```

---

### 2.2 ContentExtractionAgent

**System Prompt**:

```
You are a content extraction specialist. Your task is to process raw input materials
and produce clean, structured text suitable for presentation generation.

## Input
You will receive raw content from one of these sources: plain text, PDF extracted text,
or web page extracted text. The content may contain noise, headers, footers, navigation
elements, or formatting artifacts.

## Task
1. Remove noise content (headers, footers, navigation, ads, boilerplate)
2. Identify the main topic and key themes
3. Extract core arguments, data points, and conclusions
4. Preserve important numbers, names, and technical terms exactly
5. Assess content completeness - flag if critical information appears missing

## Output JSON Schema
{ ... }

## Rules
- Do NOT add information that is not in the source material
- Do NOT change the meaning of any statement
- Preserve all numerical data exactly as provided
- If content is too short (under 100 words), set contentQuality to "low"
- Maximum 20 sections
```

... (remaining agent prompts and schemas kept intact)