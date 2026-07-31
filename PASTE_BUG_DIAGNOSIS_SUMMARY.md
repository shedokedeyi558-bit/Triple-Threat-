# AI Paste Bug — Plain Diagnosis

## Question 1: Is the button wired?
**Answer: YES ✅**

**Evidence:** `app/admin/pills/[packId]/bank/page.tsx` line 856
```tsx
<button onClick={() => { setShowPaste(v => !v); ... }}>
```
- Button exists
- onClick handler exists
- Handler correctly toggles `showPaste` state
- Modal renders when `showPaste === true` (line 893)

---

## Question 2: Is the paste modal/textarea functional?
**Answer: YES ✅**

**Evidence:** `app/admin/pills/[packId]/bank/page.tsx` lines 601-698
- Component exists: `AIPastePanel`
- Textarea exists with `onChange` handler (line 657)
- Parse button exists with `onClick` pointing to `handleParse()` (line 669)
- handleParse calls `parseAIText(rawText)` (line 609)

---

## Question 3: Is the parser being called?
**Answer: YES, but it's likely failing silently ⚠️**

**Evidence:** `app/admin/pills/[packId]/bank/page.tsx` lines 609-612
```tsx
const handleParse = () => {
  const items = parseAIText(rawText);  // ← CALLED
  setParsed(items);                     // ← Items could be [] (empty)
  setSaveError("");                     // ← No error shown
};
```

**The Problem:**
- If `parseAIText(rawText)` returns `[]` (empty array), nothing is shown to user
- Line 667 checks: `{parsed.length > 0 && !saved && (...)}`
- **When `parsed.length === 0`, the preview doesn't render**
- No error message is displayed
- Result: **User sees nothing and thinks feature is broken**

---

## Question 4: Why would parser return empty?

**Root Cause:** Regex patterns too strict (lines 572-574)

```tsx
const isQuestionLine = (l: string) => /^(?:Q\s*[).:]|\d+\s*[.):]\s+\S)/.test(l);
const isOptionLine = (l: string) => /^[A-Da-d]\s*[.)]\s+\S/.test(l);
const isAnswerLine = (l: string) => /^(?:correct|answer|ans)\s*[:\s]/i.test(l);
```

**These require EXACT formats:**
- Question line MUST start with: `Q:` or `Q.` or `Q)` or `1:` or `1.` or `1)`
- Option line MUST start with: `A)` or `A.` or `B)` or `B.` etc (with exact spacing)
- Answer line MUST contain: `Correct:` or `Answer:` or `Ans:` (case-insensitive)

**Common ChatGPT formats that would FAIL:**
```
Question 1: ...          ❌ (has space between word and number)
Q1: ...                 ❌ (digit directly after Q)
Q: ...                  ✅ (works)
1. ...                  ✅ (works)
A) Option 1             ✅ (works)
(A) Option 1            ❌ (wrong bracket style)
```

---

## Question 5: Is there error handling?

**Answer: NO — there's a silent failure path ❌**

**Evidence:** `app/admin/pills/[packId]/bank/page.tsx` line 609
```tsx
const handleParse = () => {
  const items = parseAIText(rawText);  // ← NO TRY/CATCH
  setParsed(items);                     // ← Silent set of []
  setSaveError("");                     // ← No error shown
};
```

**What happens if parse fails:**
1. `parseAIText()` returns `[]` (silently, no error thrown)
2. `setParsed([])` is called
3. Component re-renders with empty `parsed` array
4. Preview doesn't show (line 667: `parsed.length > 0 && ...`)
5. User sees: nothing happens
6. No error message to explain why

---

## Comparison: Specials vs Library

### Specials Bank (broken)
- ✅ Button: Wired correctly
- ✅ Modal: Opens correctly
- ✅ Textarea: Functional
- ✅ Parse called: Yes, but...
- ❌ **Parser has strict regex patterns**
- ❌ **No error handling if parse returns []**
- ❌ **No feedback if parse fails**
- 🔴 **Result: Silent failure**

### Draft Library (working)
- ✅ Button: Wired correctly
- ✅ Modal: Opens correctly
- ✅ Textarea: Functional
- ✅ Parse called: Yes
- ✅ Parser has format: `Q:\n A)\n B)\n Correct:\n\n Q:\n ...`
- ✅ **Error handling:** Shows `q.error` in preview if parsing fails
- ✅ **User feedback:** Invalid items marked with error badges
- 🟢 **Result: Visible feedback on parse issues**

**Key Difference:**
- Library's `parseQuestions()` validates each parsed item and marks errors
- Specials' `parseAIText()` silently returns `[]` if nothing matches

---

## Diagnosis: Final Answer

### Is the button functional?
**YES** ✅ — Button is properly wired with onClick handler.

### Is the paste modal/textarea functional?
**YES** ✅ — Component exists and renders when button clicked.

### Is the parser being called?
**YES** ✅ — But it's likely failing silently.

### What's actually broken?
**The parser returns empty results silently, with NO user feedback.**

**Why it appears broken:**
1. User clicks "AI Paste" button
2. Modal opens, textarea appears
3. User pastes AI output
4. User clicks "Parse Questions" button
5. `parseAIText()` is called
6. Parser doesn't match the format, returns `[]`
7. No error is shown
8. Preview section doesn't render (only shows if `parsed.length > 0`)
9. User sees: modal still open but nothing happened
10. User thinks: "Feature is broken"

---

## Files Affected

- **`app/admin/pills/[packId]/bank/page.tsx`** — The broken feature
  - Line 856-860: Button (✅ works)
  - Line 893: Render condition (✅ works)
  - Line 601-698: AIPastePanel component (✅ works)
  - Line 609-612: handleParse (❌ no error handling)
  - Line 545-598: parseAIText (❌ regex too strict, silent failure)
  - Line 667: Preview condition (results in invisible feedback)

- **`app/admin/library/page.tsx`** — For comparison
  - Shows how error feedback is handled in library paste

---

## Type of Bug

**NOT:** A wiring issue — button is connected correctly  
**NOT:** A component issue — modal/textarea work fine  
**IS:** A silent failure + missing feedback issue

**Category:** Parser silently returns empty results, no error shown to user

---

## Recommended Fix (Conceptual)

Option A: **Show error when parse returns nothing**
- Line 609: Check if `items.length === 0`, set error message
- User sees: "Could not parse text. Check format matches: Q: ... A) ... Correct: A"

Option B: **Loosen regex patterns to match more formats**
- Lines 572-574: Make patterns more flexible
- Handle variations like "Q1:", "Question 1:", "1)", etc.

Option C: **Validate with error feedback like library does**
- Mark unparseable lines with error indicators
- Show user which lines couldn't be parsed and why

---

## Summary Statement

**The Specials bank AI Paste button IS wired and functional. The component opens. The parser IS called. But the parser likely returns an empty array (because the input format doesn't match strict regex patterns), there is NO error handling to catch this, and NO user feedback is shown. Result: Feature appears broken when it's actually just failing silently.**
