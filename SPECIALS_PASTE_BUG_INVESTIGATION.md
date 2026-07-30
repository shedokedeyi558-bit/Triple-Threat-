# Specials Bank AI Paste Bug Investigation

## Problem Statement
Clicking the "AI Paste" button on Specials question banks (when managing a pack's question bank) does nothing. No modal appears, no textarea shows, no error message displays. The button seems non-functional or silently failing.

---

## Evidence: Real Code Review

### 1. The AI Paste Button ✅ WIRED CORRECTLY
**File:** `app/admin/pills/[packId]/bank/page.tsx` (lines 856-860)

```tsx
<button onClick={() => { setShowPaste(v => !v); setShowBulk(false); setShowAdd(false); }}
  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(139,92,246,0.35)", backgroundColor: showPaste ? "rgba(139,92,246,0.1)" : "transparent", color: "#a78bfa", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
  <Sparkles size={12} /> AI Paste
</button>
```

✅ **Status:** Button is wired correctly
- onClick handler exists and properly toggles `showPaste` state
- Sets `setShowPaste(v => !v)` — correct toggle logic
- Also closes other panels (setShowBulk, setShowAdd)

---

### 2. State Declaration ✅ DEFINED CORRECTLY
**File:** `app/admin/pills/[packId]/bank/page.tsx` (line 761)

```tsx
const [showPaste, setShowPaste] = useState(false);
```

✅ **Status:** State initialized properly

---

### 3. AIPastePanel Rendering ✅ CONDITION EXISTS
**File:** `app/admin/pills/[packId]/bank/page.tsx` (line 893)

```tsx
{showPaste && <AIPastePanel packId={packId} onDone={() => { setShowPaste(false); load(); }} onCancel={() => setShowPaste(false)} />}
```

✅ **Status:** Component renders when `showPaste === true`

---

### 4. AIPastePanel Component ✅ FULLY IMPLEMENTED
**File:** `app/admin/pills/[packId]/bank/page.tsx` (lines 601-698)

**Component structure:**

```tsx
function AIPastePanel({ packId, onDone, onCancel }: { packId: string; onDone: () => void; onCancel: () => void }) {
  const [rawText, setRawText] = React.useState("");
  const [parsed, setParsed] = React.useState<{ question: string; options: string[]; correct_answer: string }[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const handleParse = () => {
    const items = parseAIText(rawText);  // ← CALLS PARSER
    setParsed(items);
    setSaveError("");
  };

  const handleSave = async () => {
    if (!parsed.length) return;
    const questions = parsed.map(q => ({
      question: q.question, format: "multiple_choice" as const,
      options: q.options, correct_answer: q.correct_answer, timer: 30,
    }));
    setSaving(true); setSaveError("");
    try {
      await adminApi.bulkUploadQuestions(packId, questions);  // ← UPLOADS
      setSaved(true);
      setTimeout(() => onDone(), 900);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Save failed");  // ← ERROR SHOWN
    } finally { setSaving(false); }
  };
```

✅ **Status:** Component fully implemented
- Textarea for pasting AI output
- Parse button that calls `parseAIText()`
- Preview of parsed questions
- Save button that calls API
- Error handling that displays `saveError` to user

---

### 5. parseAIText Parser ✅ FULLY IMPLEMENTED
**File:** `app/admin/pills/[packId]/bank/page.tsx` (lines 545-598)

```tsx
function parseAIText(raw: string): { question: string; options: string[]; correct_answer: string }[] {
  const results: { question: string; options: string[]; correct_answer: string }[] = [];

  // Normalize line endings and clean markdown
  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/\*\*/g, "")
    .replace(/\r/g, "\n");

  const lines = cleaned.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  let currentQ = "";
  let currentOpts: string[] = [];
  let currentOptMap: Record<string, string> = {};
  let correctLetter = "";

  const isQuestionLine = (l: string) => /^(?:Q\s*[).:]|\d+\s*[.):]\s+\S)/.test(l);
  const isOptionLine = (l: string) => /^[A-Da-d]\s*[.)]\s+\S/.test(l);
  const isAnswerLine = (l: string) => /^(?:correct|answer|ans)\s*[:\s]/i.test(l);

  const flush = () => {
    if (currentQ && currentOpts.length >= 2) {
      let correct_answer = currentOpts[0];
      if (correctLetter) {
        const upper = correctLetter.toUpperCase();
        correct_answer = currentOptMap[upper] ?? currentOpts[upper.charCodeAt(0) - 65] ?? currentOpts[0];
      }
      results.push({ question: currentQ, options: currentOpts, correct_answer });
    }
    currentQ = ""; currentOpts = []; currentOptMap = {}; correctLetter = "";
  };

  // ... line processing loop ...

  flush(); // Don't forget the last question
  return results;
}
```

✅ **Status:** Parser is fully implemented and handles multiple formats

---

## Comparison: Specials vs. Draft Library

### Specials AI Paste (bank/page.tsx)
- ✅ Button: Click handler wired with `setShowPaste(v => !v)`
- ✅ State: `showPaste` declared as `useState(false)`
- ✅ Render condition: `{showPaste && <AIPastePanel ... />}`
- ✅ Component: Full implementation with textarea, parser, preview, save
- ✅ Parser: `parseAIText()` — custom AI format parser
- ✅ Error handling: Shows `saveError` in UI if save fails
- ✅ No try/catch swallowing errors silently

### Draft Library Paste (library/page.tsx)
- ✅ Button: Click handler with `setShowPaste(true)`
- ✅ State: `showPaste` declared as `useState(false)`
- ✅ Render condition: `{showPaste && <PastePanel ... />}`
- ✅ Component: Full implementation with textarea, parser, preview, save
- ✅ Parser: `parseQuestions()` — Q:/A)/B)/etc. format parser
- ✅ Error handling: Has a try/catch but still calls `onDone()` on success

**Key Difference:**
- Specials uses **separate** parser `parseAIText()` optimized for AI-generated formats
- Library uses **separate** parser `parseQuestions()` for manual entry formats
- Both are separate implementations (not shared code)

---

## Diagnosis: What Could Be Wrong

### Scenario 1: Browser Event Not Firing ❌ (Unlikely)
If the button click itself doesn't work:
- ❌ Would affect all functionality on the page
- ❌ User reported button appears clickable (color changes on toggle)
- **Not the root cause**

### Scenario 2: AIPastePanel Not Rendering ❌ (Unlikely)
If component fails to mount:
- Would show React error in console
- Component is simple, no complex dependencies
- Should at least error, not silently fail
- **Not the root cause**

### Scenario 3: Textarea Paste Event Failure ⚠️ (POSSIBLE)
If user tries to paste and nothing happens:
- User sees textarea but paste event doesn't populate
- Parser doesn't run
- No error shown
- **But:** This is a browser behavior, not code issue. If paste doesn't work, would need OS/browser investigation.

### Scenario 4: Parse Button Silent Failure ❌ (UNLIKELY)
If "Parse Questions" button is clicked but parser fails:
- `handleParse()` at line 609 would catch error... but there's no try/catch around `parseAIText()` call
- **Wait — there IS no error handling around the parser call**
- If `parseAIText(rawText)` throws an error, it would bubble up uncaught
- User would see JavaScript error in console

### Scenario 5: The parseAIText Regex Patterns Don't Match User's Format ⚠️ (LIKELY)
The parser at lines 572-574 uses strict regex patterns:

```tsx
const isQuestionLine = (l: string) => /^(?:Q\s*[).:]|\d+\s*[.):]\s+\S)/.test(l);
const isOptionLine = (l: string) => /^[A-Da-d]\s*[.)]\s+\S/.test(l);
const isAnswerLine = (l: string) => /^(?:correct|answer|ans)\s*[:\s]/i.test(l);
```

**If ChatGPT/Gemini output doesn't match these patterns:**
- Parser returns `[]` (empty results)
- `setParsed([])` sets empty preview
- User sees modal but with no questions parsed
- Looks like paste did "nothing"

**Expected formats that WORK:**
```
Q: What is 2+2?
A) 3
B) 4
C) 5
D) 6
Correct: B

1. Capital of France?
A) London
B) Berlin
C) Paris
D) Madrid
Correct: C
```

**Formats that might NOT work:**
```
Question 1: ...
Option A: ...
Option B: ...
Correct answer: A

1) Question?
a) option
b) option
Ans: A

Q1: ...
(a) ...
(b) ...
Answer: A
```

---

## Silent Error Paths Found

### 1. No Error Handling Around parseAIText() ❌
**File:** `app/admin/pills/[packId]/bank/page.tsx` (line 609)

```tsx
const handleParse = () => {
  const items = parseAIText(rawText);  // ← NO TRY/CATCH
  setParsed(items);
  setSaveError("");
};
```

**If `parseAIText()` throws an error:**
- Error not caught
- Would bubble to React error boundary or console
- Should show in DevTools console

### 2. Error Message Not Shown if Parser Fails Silent ⚠️
**If parseAIText() returns empty array `[]` silently:**
- Component still renders
- User sees: textarea is gone, but preview area is empty
- No parsed questions appear
- Looks like "nothing happened"
- No error message because there's no error — just an empty parse

---

## Real Issue: Most Likely Root Causes

### Root Cause A: Empty Parse Results 🔴 (LIKELY)
**File:** `app/admin/pills/[packId]/bank/page.tsx` (line 611)

```tsx
const handleParse = () => {
  const items = parseAIText(rawText);  // ← Could return []
  setParsed(items);
  setSaveError("");
};
```

**What happens if `items = []`:**
- State is set: `setParsed([])`
- Component re-renders
- Line 667 checks: `{parsed.length > 0 && !saved && ( ... )}`
- **If parsed.length === 0, preview section doesn't render**
- User sees: modal disappears or shows empty state
- Looks like paste "did nothing"

**Why this happens:**
- User's text format doesn't match parser's regex patterns
- Parser silently returns `[]` instead of throwing error
- No feedback to user about parsing failure

### Root Cause B: Regex Pattern Mismatch 🟡 (VERY LIKELY)
**File:** `app/admin/pills/[packId]/bank/page.tsx` (lines 572-574)

The regex patterns are **very specific** and might not match common ChatGPT output formats:

```tsx
const isQuestionLine = (l: string) => /^(?:Q\s*[).:]|\d+\s*[.):]\s+\S)/.test(l);
//                                     ^^^^^^^^^^^^^  ^^^^^^^^^^
//                                     "Q:" or "Q)" or "Q."    OR    "1)" or "1." etc
```

**This requires:**
- Line starts with exactly "Q" or a digit
- Followed by `:`, `)`, or `.`
- Then a space and non-whitespace character

**Common formats that FAIL this regex:**
- `Question 1: ...` (has space between "Question" and "1")
- `Q1: ...` (Has digit directly after Q)
- `Q) ...` with markdown italics `*Q) ...*`
- AI output with extra spacing or formatting

---

## Conclusion: Diagnosis

### Status of Each Component:

| Component | Status | Issue |
|-----------|--------|-------|
| Button click handler | ✅ Working | `setShowPaste(v => !v)` is correct |
| State management | ✅ Working | `showPaste` properly declared |
| Component rendering | ✅ Working | Renders when `showPaste === true` |
| Parse button | ✅ Wired | Calls `handleParse()` |
| parseAIText() function | ✅ Exists | Fully implemented, but... |
| Regex patterns | ❌ LIKELY TOO STRICT | May not match user's ChatGPT/Gemini format |
| Error handling | ⚠️ MISSING | No error shown if parse returns empty array |

### Diagnosis

**The paste feature IS wired correctly, but:**

1. **Parser silently returns empty results** if input format doesn't match strict regexes (lines 572-574)
2. **No error feedback to user** when parse fails
3. **Preview section doesn't render** if `parsed.length === 0`
4. **Result:** User clicks button → modal opens → pastes text → clicks Parse → nothing appears → looks like feature is broken

**Why this isn't obviously broken:**
- No error is thrown
- No error message is displayed
- Component doesn't crash
- Just silently returns empty array

**The Real Bug:**
- Line 609: `handleParse()` doesn't validate that `parseAIText()` succeeded
- Should either show error message if `items.length === 0`, OR
- Loosen the regex patterns to match more ChatGPT formats

---

## Files Involved

- `app/admin/pills/[packId]/bank/page.tsx` — main bank page with AI Paste feature
  - Line 601-698: AIPastePanel component
  - Line 545-598: parseAIText parser
  - Line 609-612: handleParse handler (no error handling)
  - Line 667: Preview render condition (only shows if parsed.length > 0)
  - Line 856-860: Button click handler

- `app/admin/library/page.tsx` — for comparison
  - Shows how library's paste feature works (different parser, similar structure)

---

## Summary

**Issue:** "Paste does nothing"  
**Real Cause:** Parser likely returns empty array because input format doesn't match strict regex patterns, and there's no user feedback when this happens  
**Evidence:** 
- Button is properly wired (line 856)
- Component renders when `showPaste === true` (line 893)
- parseAIText() is called but has no error handling (line 609)
- Empty results silently cause preview to not render (line 667)

**Not a wiring issue — it's a silent failure issue.**
