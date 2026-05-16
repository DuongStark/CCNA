#!/usr/bin/env python3
"""
Generate AI explanations for CCNA quiz questions.
- Checkpoints after each question (safe to re-run)
- Configurable delay to avoid rate limits
- Skips questions that already have explanations
"""

import json
import time
import requests
import sys
import os

# Config
INPUT_FILE = sys.argv[1] if len(sys.argv) > 1 else '/home/dev/CCNA/output_docx/json/CCNA_Automation_Programmability.json'
DELAY = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0  # seconds between requests
API_URL = 'http://localhost:20128/v1/chat/completions'
MODEL = 'kr/claude-sonnet-4.6'

SYSTEM_PROMPT = """You are a CCNA exam tutor. Given a multiple-choice question, explain why the correct answer is right and briefly why the wrong answers are incorrect.

Adjust length based on complexity:
- Simple/factual questions (definitions, basic mappings): 2-3 short sentences. Be direct.
- Complex questions (topology, config, multi-concept, troubleshooting): 4-6 sentences with more detail.

Write in Vietnamese. Plain text only — no markdown, no bold, no backticks, no bullet points."""

def build_prompt(q):
    options_text = '\n'.join(f"  {k}. {v}" for k, v in q.get('options', {}).items())
    answer = q.get('answer', [])
    if isinstance(answer, list):
        answer_str = ', '.join(answer)
    else:
        answer_str = str(answer)
    
    answer_text = '\n'.join(
        f"  {k}. {q['options'][k]}"
        for k in (answer if isinstance(answer, list) else [answer])
        if k in q.get('options', {})
    )

    return f"""Question: {q['question']}

Options:
{options_text}

Correct answer: {answer_str}
{answer_text}

Please explain why this is the correct answer and briefly why the other options are wrong."""

def call_api(prompt):
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 500,
        "stream": False
    }
    
    response = requests.post(API_URL, json=payload, timeout=60)
    response.raise_for_status()
    data = response.json()
    return data['choices'][0]['message']['content'].strip()

def main():
    print(f"Loading: {INPUT_FILE}")
    with open(INPUT_FILE) as f:
        data = json.load(f)
    
    questions = data.get('questions', data) if isinstance(data, dict) else data
    
    total = len(questions)
    skipped = sum(1 for q in questions if q.get('explanation', '').strip())
    todo = total - skipped
    
    print(f"Total: {total} | Already done: {skipped} | To generate: {todo}")
    print(f"Delay: {DELAY}s/request | ETA: ~{todo * DELAY / 60:.1f} min\n")
    
    done = 0
    errors = 0
    
    for i, q in enumerate(questions):
        if q.get('explanation', '').strip():
            continue
        
        qid = q.get('id', i)
        print(f"[{done+1}/{todo}] id={qid} ... ", end='', flush=True)
        
        try:
            prompt = build_prompt(q)
            explanation = call_api(prompt)
            
            if explanation:
                q['explanation'] = explanation
                # Checkpoint — save after every question
                with open(INPUT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"OK ({len(explanation)} chars)")
                done += 1
            else:
                print("EMPTY — skipping")
                errors += 1
                
        except Exception as e:
            print(f"ERROR: {e}")
            errors += 1
        
        if done + errors < todo:
            time.sleep(DELAY)
    
    print(f"\nDone: {done} generated, {errors} errors, {skipped} already had explanation.")

if __name__ == '__main__':
    main()
