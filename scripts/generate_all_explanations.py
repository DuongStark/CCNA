#!/usr/bin/env python3
"""
Generate AI explanations for ALL CCNA quiz files.
- Processes all pdf/docx/odt JSON files
- Skips questions that already have Vietnamese explanations
- Re-generates English-only explanations
- Checkpoint after every question
- Timeout + retry per request (no hanging)
- Progress log to /tmp/explain_all.log
"""

import json
import time
import requests
import os
import glob
import sys
from datetime import datetime

DELAY = 3.0       # seconds between requests
TIMEOUT = 25      # seconds per API call
MAX_RETRIES = 3   # retries on failure
RETRY_DELAY = 10  # seconds between retries

API_URL = 'http://localhost:20128/v1/chat/completions'
MODEL = 'kr/claude-sonnet-4.6'
LOG_FILE = '/tmp/explain_all.log'
PROGRESS_FILE = '/tmp/explain_all_progress.json'

FILES = [
    # (source, json_path)
    ('pdf', '/home/dev/CCNA/output_pdf/json/tcp-udp.json'),
    ('pdf', '/home/dev/CCNA/output_pdf/json/ip_services.json'),
    ('pdf', '/home/dev/CCNA/output_pdf/json/automation-virtual-sdn.json'),
    ('pdf', '/home/dev/CCNA/output_pdf/json/layer2_technologies.json'),
    ('pdf', '/home/dev/CCNA/output_pdf/json/routing.json'),
    ('pdf', '/home/dev/CCNA/output_pdf/json/security-and-wireless.json'),
    ('docx', '/home/dev/CCNA/output_docx/json/CCNA_IP_Services.json'),
    ('docx', '/home/dev/CCNA/output_docx/json/CCNA_Network_Fundamentals.json'),
    ('docx', '/home/dev/CCNA/output_docx/json/CCNA_IP_Connectivity.json'),
    ('docx', '/home/dev/CCNA/output_docx/json/CCNA_Security_Fundamentals.json'),
    ('docx', '/home/dev/CCNA/output_docx/json/CCNA_Network_Access.json'),
    ('odt', '/home/dev/CCNA/output_odt/json/Part 11.json'),
    ('odt', '/home/dev/CCNA/output_odt/json/Part 12.json'),
    ('odt', '/home/dev/CCNA/output_odt/json/Part 13.json'),
    ('odt', '/home/dev/CCNA/output_odt/json/part 14.json'),
    ('odt', '/home/dev/CCNA/output_odt/json/part 15.json'),
    ('odt', '/home/dev/CCNA/output_odt/json/Part 16.json'),
]

SYSTEM_PROMPT = """You are a CCNA exam tutor. Given a multiple-choice question, explain why the correct answer is right and briefly why the wrong answers are incorrect.

Adjust length based on complexity:
- Simple/factual questions (definitions, basic mappings): 2-3 short sentences. Be direct.
- Complex questions (topology, config, multi-concept, troubleshooting): 4-6 sentences with more detail.

Write in Vietnamese. Plain text only — no markdown, no bold, no backticks, no bullet points."""


def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')


def needs_generate(q):
    if not isinstance(q, dict):
        return False
    exp = q.get('explanation') or ''
    if not exp.strip():
        return True
    # Re-generate if English only (no Vietnamese chars)
    if not any(ord(c) > 127 for c in exp):
        return True
    return False


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

Explain why this is correct and briefly why others are wrong."""


def call_api(prompt):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = requests.post(API_URL, json={
                'model': MODEL,
                'messages': [
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': prompt},
                ],
                'max_tokens': 500,
                'stream': False,
            }, timeout=TIMEOUT)
            r.raise_for_status()
            data = r.json()
            return data['choices'][0]['message']['content'].strip()
        except requests.exceptions.Timeout:
            log(f"  TIMEOUT (attempt {attempt}/{MAX_RETRIES})")
        except requests.exceptions.HTTPError as e:
            log(f"  HTTP ERROR {e} (attempt {attempt}/{MAX_RETRIES})")
        except Exception as e:
            log(f"  ERROR {e} (attempt {attempt}/{MAX_RETRIES})")
        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
    return None


def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {'total_done': 0, 'total_errors': 0, 'files_done': []}


def save_progress(p):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(p, f)


def process_file(source, fpath, progress):
    fname = os.path.basename(fpath)
    if fpath in progress['files_done']:
        log(f"SKIP (already done): {fname}")
        return

    log(f"\n{'='*50}")
    log(f"FILE: [{source}] {fname}")

    with open(fpath, encoding='utf-8') as f:
        data = json.load(f)

    questions = data.get('questions', data) if isinstance(data, dict) else data
    todo = [q for q in questions if needs_generate(q)]
    skipped = len(questions) - len(todo)

    log(f"Total: {len(questions)} | Need: {len(todo)} | Skip: {skipped}")

    done = 0
    errors = 0

    for i, q in enumerate(questions):
        if not needs_generate(q):
            continue

        qid = q.get('id', i)
        log(f"  [{done+1}/{len(todo)}] id={qid} ... ", )

        prompt = build_prompt(q)
        explanation = call_api(prompt)

        if explanation:
            q['explanation'] = explanation
            # Checkpoint
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            log(f"  [{done+1}/{len(todo)}] id={qid} ... OK ({len(explanation)} chars)")
            done += 1
            progress['total_done'] += 1
        else:
            log(f"  [{done+1}/{len(todo)}] id={qid} ... FAILED after {MAX_RETRIES} retries")
            errors += 1
            progress['total_errors'] += 1

        save_progress(progress)

        if done + errors < len(todo):
            time.sleep(DELAY)

    log(f"FILE DONE: {done} generated, {errors} errors")
    progress['files_done'].append(fpath)
    save_progress(progress)


def main():
    # Clear log on fresh start (not resume)
    resume = '--resume' in sys.argv
    if not resume and os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    if not resume and os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)

    log("=== CCNA Explanation Generator ===")
    log(f"Files: {len(FILES)} | Delay: {DELAY}s | Timeout: {TIMEOUT}s | Retries: {MAX_RETRIES}")

    progress = load_progress()
    start_done = progress['total_done']

    for source, fpath in FILES:
        process_file(source, fpath, progress)

    total_generated = progress['total_done'] - start_done
    log(f"\n{'='*50}")
    log(f"ALL DONE: {total_generated} generated, {progress['total_errors']} errors total")


if __name__ == '__main__':
    main()
