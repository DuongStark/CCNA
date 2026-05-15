#!/usr/bin/env python3
"""
Extract CCNA questions + images from PDF.
Parse theo text flow toàn bộ PDF.
Dùng get_image_rects() để lấy vị trí ảnh chính xác.
"""
import fitz
import json
import os
import re

PDF_MAP = {
    'routing': '/home/dev/CCNA/dump_extracted/dump/routing.pdf',
    'ip_services': '/home/dev/CCNA/dump_extracted/dump/ip services.pdf',
    'layer2_technologies': '/home/dev/CCNA/dump_extracted/dump/Layer2 Technologies.pdf',
    'tcp-udp': '/home/dev/CCNA/dump_extracted/dump/TCP-UDP.pdf',
    'automation-virtual-sdn': '/home/dev/CCNA/dump_extracted/dump/automation-virtual-sdn.pdf',
    'security-and-wireless': '/home/dev/CCNA/dump_extracted/dump/secuirty-and-wireless.pdf',
}

OUTPUT_BASE = '/home/dev/CCNA/output_pdf_v2'


def get_all_blocks(doc):
    """Lấy tất cả blocks (text + image) theo thứ tự xuất hiện, có page offset để sort đúng."""
    all_blocks = []
    PAGE_HEIGHT = 842  # A4 height in points

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_offset = page_num * PAGE_HEIGHT

        # Text blocks
        for b in page.get_text('blocks'):
            if b[6] == 0 and b[4].strip():
                all_blocks.append({
                    'type': 'text',
                    'page': page_num,
                    'y': page_offset + b[1],
                    'text': b[4].strip(),
                })

        # Image blocks — dùng get_image_rects để lấy vị trí chính xác
        for img in page.get_images():
            xref = img[0]
            rects = page.get_image_rects(xref)
            if rects:
                y = rects[0].y0
                all_blocks.append({
                    'type': 'image',
                    'page': page_num,
                    'y': page_offset + y,
                    'xref': xref,
                })

    # Sort theo y toàn bộ
    all_blocks.sort(key=lambda b: b['y'])
    return all_blocks


def extract_pdf(topic, pdf_path):
    print(f"\n=== {topic} ===")
    doc = fitz.open(pdf_path)

    img_dir = f"{OUTPUT_BASE}/{topic}/images"
    os.makedirs(img_dir, exist_ok=True)
    os.makedirs(f"{OUTPUT_BASE}/json", exist_ok=True)

    all_blocks = get_all_blocks(doc)
    img_counter = [0]

    def save_image(xref, page_num):
        try:
            base_img = doc.extract_image(xref)
            ext = base_img['ext']
            name = f"page_{page_num+1}_img_{img_counter[0]}.{ext}"
            with open(f"{img_dir}/{name}", 'wb') as f:
                f.write(base_img['image'])
            img_counter[0] += 1
            return name
        except Exception as e:
            print(f"  Error saving image: {e}")
            return None

    questions = []
    current_q = None
    state = 'preamble'
    after_exhibit = False

    for block in all_blocks:
        if block['type'] == 'text':
            text = block['text']

            # Detect "Question N"
            q_match = re.match(r'^Question\s+(\d+)', text, re.IGNORECASE)
            if q_match:
                if current_q:
                    questions.append(current_q)
                current_q = {
                    'id': q_match.group(1),
                    'question': '',
                    'question_images': [],
                    'options': {},
                    'answer': [],
                    'answer_images': [],
                    'explanation': '',
                    'explanation_images': [],
                }
                state = 'question'
                after_exhibit = False
                rest = re.sub(r'^Question\s+\d+\s*', '', text, flags=re.IGNORECASE).strip()
                if rest:
                    current_q['question'] = rest
                continue

            if current_q is None:
                continue

            # Detect Answer
            if re.match(r'^Answer\s*[:\s]', text, re.IGNORECASE):
                state = 'answer'
                after_exhibit = False
                ans = re.findall(r'\b([A-E])\b', text)
                current_q['answer'] = ans
                continue

            # Detect Explanation
            if re.match(r'^Explanation\b', text, re.IGNORECASE):
                state = 'explanation'
                after_exhibit = False
                rest = re.sub(r'^Explanation\s*', '', text, flags=re.IGNORECASE).strip()
                if rest:
                    current_q['explanation'] = rest
                continue

            # Detect "Refer to the exhibit"
            if re.search(r'refer to the exhibit', text, re.IGNORECASE):
                after_exhibit = True

            # Detect options A. B. C. D. E. — có thể nhiều options trong 1 block
            opt_match = re.match(r'^([A-E])\.\s*(.*)', text, re.DOTALL)
            if opt_match and state in ('question', 'options'):
                state = 'options'
                after_exhibit = False
                # Split block thành nhiều options nếu có \nB. \nC. etc
                parts = re.split(r'\n(?=[A-E]\.)', text)
                for part in parts:
                    m = re.match(r'^([A-E])\.\s*(.*)', part.strip(), re.DOTALL)
                    if m:
                        current_q['options'][m.group(1).upper()] = m.group(2).strip()
                continue

            # Append text
            if state == 'question':
                current_q['question'] = (current_q['question'] + '\n' + text).strip()
            elif state == 'options' and current_q['options']:
                last = list(current_q['options'].keys())[-1]
                current_q['options'][last] += '\n' + text
            elif state == 'explanation':
                current_q['explanation'] = (current_q['explanation'] + '\n' + text).strip()

        elif block['type'] == 'image':
            if current_q is None:
                continue

            img_name = save_image(block['xref'], block['page'])
            if not img_name:
                continue

            if state == 'explanation':
                current_q['explanation_images'].append(img_name)
            elif state == 'answer':
                current_q['answer_images'].append(img_name)
            elif state == 'options':
                current_q['explanation_images'].append(img_name)
            elif after_exhibit or state == 'question':
                current_q['question_images'].append(img_name)
                after_exhibit = False
            else:
                current_q['explanation_images'].append(img_name)

    if current_q:
        questions.append(current_q)

    # Deduplicate answers
    for q in questions:
        q['answer'] = list(dict.fromkeys(q['answer']))

    # Save JSON
    out_path = f"{OUTPUT_BASE}/json/{topic}.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({'count': len(questions), 'questions': questions}, f, ensure_ascii=False, indent=2)

    # Stats
    with_q_imgs = sum(1 for q in questions if q['question_images'])
    with_exp_imgs = sum(1 for q in questions if q['explanation_images'])
    exhibit_no_img = sum(1 for q in questions
                         if re.search(r'refer to the exhibit', q['question'], re.IGNORECASE)
                         and not q['question_images'])

    print(f"  Questions: {len(questions)}")
    print(f"  With question_images: {with_q_imgs}")
    print(f"  With explanation_images: {with_exp_imgs}")
    print(f"  'Refer to exhibit' but no image: {exhibit_no_img}")
    return questions


os.makedirs(OUTPUT_BASE, exist_ok=True)
for topic, pdf_path in PDF_MAP.items():
    if not os.path.exists(pdf_path):
        print(f"SKIP {topic}: not found")
        continue
    extract_pdf(topic, pdf_path)

print("\nDone! Output:", OUTPUT_BASE)
