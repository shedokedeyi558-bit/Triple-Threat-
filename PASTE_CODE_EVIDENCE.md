# AI Paste Bug — Real Code Evidence

## The Flow: Button → Modal → Parse → (Silent Fail)

### Step 1: Button Click Handler
**File:** `app/admin/pills/[packId]/bank/page.tsx:856-860`

```tsx
<button onClick={() => { setShowPaste(v => !v); setShowBulk(false); setShowAdd(false); }}
  style={{ ... }}>
  <Sparkles size={12} /> AI Paste
</button>
```

✅ **Status:** Working — onClick toggles `showPaste` state correctly

---

### Step 2: Modal Renders When State Changes
**File:** `app/admin/pills/[packId]/bank/page.tsx:893`

```tsx
{showPaste && <AIPastePanel packId={packId} onDone={() => { setShowPaste(false); load(); }} onCancel={() => setShowPaste(false)} />}
```

✅ **Status:** Working — Component renders when `showPaste === true`

---

### Step 3: User Pastes Text, Clicks "Parse Questions"
**File:** `app/admin/pills/[packId]/bank/page.tsx:657-670`

```tsx
{/* Paste area — only show before parse */}
{!parsed.length && (
  <>
    <textarea value={rawText} onChange={e => setRawText(e.target.value)} rows={10}
      placeholder={`Q: What is the capital of France? ...`}
      style={{ ... }} />
    <button onClick={handleParse} disabled={!rawText.trim()}
      style={{ ... }}>
      <Sparkles size={12} /> Parse Questions
    </button>
  </>
)}
```

✅ **Status:** Textarea and Parse button are functional

---

### Step 4: handleParse Called — THIS IS WHERE IT BREAKS
**File:** `app/admin/pills/[packId]/bank/page.tsx:609-612`

```tsx
const handleParse = () => {
  const items = parseAIText(rawText);  // ← CALLS PARSER
  setParsed(items);                     // ← Could be [] (empty)
  setSaveError("");                     // ← No error shown
};
```

⚠️ **Status:** ISSUE FOUND
- Line 609: `parseAIText(rawText)` is called with user's input
- If input format doesn't match parser's regex, returns `[]`
- No error handling to catch this
- No user feedback

---

### Step 5: Parser Processes Input — Silent Failure Path
**File:** `app/admin/pills/[packId]/bank/page.tsx:545-598`

```tsx
function parseAIText(raw: string): { question: string; options: string[]; correct_answer: string }[] {
  const results: { question: string; options: string[]; correct_answer: string }[] = [];

  // Normalize line endings and clean markdown
  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/\*\*/g, "")
    .replace(/\r/g, "\n");

  const lines = cleaned.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // ← STRICT REGEX PATTERNS:
  const isQuestionLine = (l: string) => /^(?:Q\s*[).:]|\d+\s*[.):]\s+\S)/.test(l);
  const isOptionLine = (l: string) => /^[A-Da-d]\s*[.)]\s+\S/.test(l);
  const isAnswerLine = (l: string) => /^(?:correct|answer|ans)\s*[:\s]/i.test(l);

  // ... processing loop ...
  
  // If no lines match the patterns, results stays []
  flush(); // Push final question if any
  return results;  // ← Could be [] (empty)
}
```

🔴 **Issue:** 
- Regex patterns are VERY strict
- If input format doesn't match, silently returns `[]`
- No validation, no error thrown
- No way for caller to know if parse succeeded

**Regex Requirements:**
```
Question line MUST match:
  /^(?:Q\s*[).:]|\d+\s*[.):]\s+\S)/
  = starts with "Q" or digit, followed by punctuation and space

Option line MUST match:
  /^[A-Da-d]\s*[.)]\s+\S/
  = starts with A-D, optional space, punctuation, space, non-space

Answer line MUST match:
  /^(?:correct|answer|ans)\s*[:\s]/i
  = starts with "correct" or "answer" or "ans" (case-insensitive)
```

**Common failures:**
- ChatGPT: "Question 1: ..." ❌ (space between "Question" and digit)
- ChatGPT: "Option A: ..." ❌ (full word instead of letter)
- Markdown: "*Q:*" ❌ (markdown formatting)

---

### Step 6: Component Checks Parsed Length — Preview Hidden
**File:** `app/admin/pills/[packId]/bank/page.tsx:667-715`

```tsx
{/* Preview */}
{parsed.length > 0 && !saved && (
  <>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
        {parsed.length} question{parsed.length !== 1 ? "s" : ""} parsed — review before saving
      </p>
      ...
```

❌ **Status:** ISSUE FOUND
- Line 667: Condition is `parsed.length > 0 && !saved`
- If `parsed.length === 0` (from silent parser failure), preview **doesn't render**
- User sees: modal is open, textarea is gone, but nothing appears
- Looks like "paste did nothing"

---

## Comparison: Why Library Paste Works

### Library's parseQuestions (Handles Errors) ✅
**File:** `app/admin/library/page.tsx:20-76`

```tsx
function parseQuestions(raw: string): PastedQuestion[] {
  // ...parsing logic...
  const results: PastedQuestion[] = [];
  
  // ...for each parsed item:
  results.push({
    id: q.id!,
    question: q.question || "",
    options: q.options!,
    correct_answer: q.correct_answer || "A",
    error: errors.length ? errors.join(" · ") : undefined,  // ← INCLUDES ERROR FIELD
  });
```

✅ **Key Difference:**
- Each item has an `error` field
- If parsing fails for a line, error is recorded
- Preview shows error messages inline
- User sees exactly which lines failed and why

### Library's Preview Display ✅
**File:** `app/admin/library/page.tsx:133-168`

```tsx
{parsed.map((q, i) => {
  const hasError = q.error || !q.question.trim() || !q.options.every(o => o.trim());
  return (
    <div key={q.id} style={{ 
      ... border: `1px solid ${hasError ? "rgba(239,68,68,0.3)" : ...}` ...
    }}>
      {/* Shows question */}
      {/* Shows options */}
      {hasError && (
        <div style={{ ... }}>
          <AlertCircle size={12} style={{ color: "#f87171" }} />
          <span style={{ ... color: "#f87171" ... }}>{q.error}</span>  // ← ERROR SHOWN
        </div>
      )}
```

✅ **Key Difference:**
- Preview shows ALL parsed items, even ones with errors
- Error badges are displayed inline
- User sees feedback immediately
- User knows exactly what failed

---

## The Difference

### Specials AI Paste (Silent Failure)
```
User action: Paste text, click Parse
        ↓
parseAIText(text)
        ↓
Regex doesn't match format
        ↓
Return [] (empty array, NO ERROR THROWN)
        ↓
setParsed([])
        ↓
parsed.length === 0
        ↓
Preview condition fails: {parsed.length > 0 && ...}
        ↓
Preview doesn't render
        ↓
Result: User sees NOTHING and thinks feature is broken
```

### Library Paste (Error Feedback)
```
User action: Paste text, click Parse
        ↓
parseQuestions(text)
        ↓
Parsing succeeds or partially succeeds
        ↓
Returns array with error field populated
        ↓
setParsed([{question, error: "..."}, ...])
        ↓
parsed.length > 0 (at least 1 item, even with errors)
        ↓
Preview condition passes: {parsed.length > 0 && ...}
        ↓
Preview renders and shows error badges on failed items
        ↓
Result: User sees feedback about what failed
```

---

## The Smoking Gun: Missing Error Handling

### Specials Bank (Line 609) — NO ERROR HANDLING
```tsx
const handleParse = () => {
  const items = parseAIText(rawText);  // ← No try/catch
  setParsed(items);                     // ← Silent set
  setSaveError("");                     // ← Clears any previous error
};
```

### Library (Line 84-87) — SAME PATTERN (But works differently)
```tsx
const handleParse = () => {
  const p = parseQuestions(raw);        // ← No try/catch either
  setParsed(p);                          // ← Sets items
  setShowPreview(true);                  // ← Forces preview to show
};
```

**The difference:**
- Library: `parseQuestions()` ALWAYS returns array (even with errors) → preview shows
- Specials: `parseAIText()` returns `[]` if no matches → preview hidden

---

## Summary: Where It Breaks

| Location | Code | Status | Issue |
|----------|------|--------|-------|
| Button | Line 856 | ✅ Works | onClick handler wired |
| Modal | Line 893 | ✅ Works | Renders when state true |
| Textarea | Line 657 | ✅ Works | onChange updates state |
| Parse button | Line 670 | ✅ Works | onClick calls handleParse |
| handleParse | Line 609 | ❌ BROKEN | No error handling |
| parseAIText regex | Lines 572-574 | ❌ TOO STRICT | Returns [] silently |
| Preview condition | Line 667 | ⚠️ CONSEQUENCE | Hides when parsed=[] |

---

## Conclusion

**Every part of the feature is implemented and wired correctly, EXCEPT:**

1. **Parser fails silently** (line 545-598)
   - If input format doesn't match strict regexes, returns `[]`
   - No validation, no error thrown

2. **No error handling** (line 609)
   - `handleParse()` doesn't check if parse succeeded
   - Doesn't validate `items.length > 0`
   - Doesn't show error message if parse failed

3. **UI hides when parse returns nothing** (line 667)
   - Preview only shows if `parsed.length > 0`
   - When empty, preview doesn't render
   - User sees modal still open but "nothing happened"

**Result:** Feature appears completely broken when it's actually just silently failing with no feedback.
