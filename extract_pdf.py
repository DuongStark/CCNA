#!/usr/bin/env python3
"""
Extract CCNA questions + images from PDF files.
Logic:
- Image after "Refer to the exhibit" and before options/answer → question_images
- Image after "Answer" or "Explanation" → explanation_images (skip)
- Each question starts with "Question N"
"""
import fitz
import json
import os
import re
import shutil
from pathlib import Path

PDF_MAP = {
    'routing': '/home/dev/CCNA/dump_extracted/dump/routing.pdf',
    'ip_services': '/home/dev/CCNA/dump_extracted/dump/ip services.pdf',
    'layer2_technologies': '/home/dev/CCNA/dump_extracted/dump/Layer2 Technologies.pdf',
    'tcp-udp': '/home/dev/CCNA/dump_extracted/dump/TCP-UDP.pdf',
    'automation-virtual-sdn': '/home/dev/CCNA/dump_extracted/dump/automation-virtual-sdn.pdf',
    'security-and-wireless': '/home/dev/CCNA/dump_extracted/dump/secuirty-and-wireless.pdf',
}

OUTPUT_BASE = '/home/dev/CCNA/output_pdf_v2'

def extract_pdf(topic, pdf_path):
    print(f"\n=== {topic} ===")
    doc = fitz.open(pdf_path)
    
    img_dir = f"{OUTPUT_BASE}/{topic}/images"
    os.makedirs(img_dir, exist_ok=True)
    
    questions = []
    current_q = None
    img_counter = {}  # page -> count
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Get all blocks sorted by y position
        raw = page.get_text('rawdict')
        blocks = sorted(raw.get('blocks', []), key=lambda b: b['bbox'][1])
        
        for block in blocks:
            bbox = block['bbox']
            y = bbox[1]
            
            if block['type'] == 0:  # text block
                # Combine all text in block
                text = ''
                for line in block.get('lines', []):
                    for span in line.get('spans', []):
                        text += span.get('text', '')
                    text += '\n'
                text = text.strip()
                if not text:
                    continue
                
                # Check for new question
                q_match = re.match(r'^Question\s+(\d+)', text, re.IGNORECASE)
                if q_match:
                    if current_q:
                        questions.append(current_q)
                    q_num = q_match.group(1)
                    current_q = {
                        'id': q_num,
                        'source_id': q_num,
                        'question': '',
                        'question_images': [],
                        'options': {},
                        'answer': [],
                        'answer_images': [],
                        'explanation': '',
                        'explanation_images': [],
                        '_state': 'question',  # question, options, answer, explanation
                        '_page': page_num,
                        '_after_exhibit': False,
                    }
                    # Get text after "Question N"
                    rest = re.sub(r'^Question\s+\d+\s*', '', text, flags=re.IGNORECASE).strip()
                    if rest:
                        current_q['question'] = rest
                    continue
                
                if current_q is None:
                    continue
                
                # Detect state transitions
                if re.match(r'^Answer\s*:', text, re.IGNORECASE) or re.match(r'^Answer\s*$', text, re.IGNORECASE):
                    current_q['_state'] = 'answer'
                    # Extract answer letters
                    ans = re.findall(r'\b([A-E])\b', text)
                    current_q['answer'] = ans
                    current_q['_after_exhibit'] = False
                    continue
                
                if re.match(r'^Explanation', text, re.IGNORECASE):
                    current_q['_state'] = 'explanation'
                    current_q['_after_exhibit'] = False
                    rest = re.sub(r'^Explanation\s*', '', text, flags=re.IGNORECASE).strip()
                    if rest:
                        current_q['explanation'] = rest
                    continue
                
                # Detect "Refer to the exhibit"
                if 'refer to the exhibit' in text.lower():
                    current_q['_after_exhibit'] = True
                
                # Detect options A. B. C. D. E.
                opt_match = re.match(r'^([A-E])\.\s*(.*)', text, re.DOTALL)
                if opt_match and current_q['_state'] in ('question', 'options'):
                    current_q['_state'] = 'options'
                    current_q['_after_exhibit'] = False
                    letter = opt_match.group(1)
                    opt_text = opt_match.group(2).strip()
                    current_q['options'][letter] = opt_text
                    continue
                
                # Append text to current state
                if current_q['_state'] == 'question':
                    if current_q['question']:
                        current_q['question'] += '\n' + text
                    else:
                        current_q['question'] = text
                elif current_q['_state'] == 'options':
                    # Continuation of last option
                    if current_q['options']:
                        last_key = list(current_q['options'].keys())[-1]
                        current_q['options'][last_key] += '\n' + text
                elif current_q['_state'] == 'explanation':
                    if current_q['explanation']:
                        current_q['explanation'] += '\n' + text
                    else:
                        current_q['explanation'] = text
            
            elif block['type'] == 1:  # image block
                if current_q is None:
                    continue
                
                # Extract image
                p = page_num
                if p not in img_counter:
                    img_counter[p] = 0
                
                # Get image from page
                img_list = page.get_images()
                if img_counter[p] < len(img_list):
                    xref = img_list[img_counter[p]][0]
                    img_counter[p] += 1
                    
                    try:
                        base_img = doc.extract_image(xref)
                        img_ext = base_img['ext']
                        img_bytes = base_img['image']
                        img_name = f"page_{page_num+1}_img_{img_counter[p]-1}.{img_ext}"
                        img_path = f"{img_dir}/{img_name}"
                        
                        with open(img_path, 'wb') as f:
                            f.write(img_bytes)
                        
                        # Assign to correct field
                        state = current_q['_state']
                        after_exhibit = current_q.get('_after_exhibit', False)
                        
                        if state == 'explanation':
                            current_q['explanation_images'].append(img_name)
                        elif state == 'answer':
                            current_q['answer_images'].append(img_name)
                        elif after_exhibit or state == 'question':
                            current_q['question_images'].append(img_name)
                            current_q['_after_exhibit'] = False
                        else:
                            current_q['explanation_images'].append(img_name)
                    except Exception as e:
                        print(f"  Error extracting image page {page_num+1}: {e}")
    
    # Add last question
    if current_q:
        questions.append(current_q)
    
    # Clean up internal state fields
    for q in questions:
        for key in ['_state', '_page', '_after_exhibit']:
            q.pop(key, None)
    
    # Save JSON
    os.makedirs(f"{OUTPUT_BASE}/json", exist_ok=True)
    out_path = f"{OUTPUT_BASE}/json/{topic}.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({'count': len(questions), 'questions': questions}, f, ensure_ascii=False, indent=2)
    
    # Stats
    with_q_imgs = sum(1 for q in questions if q['question_images'])
    with_exp_imgs = sum(1 for q in questions if q['explanation_images'])
    exhibit_no_img = sum(1 for q in questions if 'refer to the exhibit' in q['question'].lower() and not q['question_images'])
    
    print(f"  Questions: {len(questions)}")
    print(f"  With question_images: {with_q_imgs}")
    print(f"  With explanation_images: {with_exp_imgs}")
    print(f"  'Refer to exhibit' but no image: {exhibit_no_img}")
    
    return questions

# Run extraction
os.makedirs(OUTPUT_BASE, exist_ok=True)

for topic, pdf_path in PDF_MAP.items():
    if not os.path.exists(pdf_path):
        print(f"SKIP {topic}: {pdf_path} not found")
        continue
    extract_pdf(topic, pdf_path)

print("\nDone! Output at:", OUTPUT_BASE)
