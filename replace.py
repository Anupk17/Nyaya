import os

replacements = [
    ('', ''),
    ('', ''),
    ('', ''),
    ('', ''),
    ('', ''),
    ('', ''),
    ('Nyaya AI Autonomous Dispute Resolution Engine • ', 'Nyaya AI · Autonomous Dispute Resolution Platform'),
    ('Nyaya AI Autonomous Dispute Resolution Engine. \n         ', 'Nyaya AI · Autonomous Dispute Resolution Platform'),
    ('E-commerce Consumer Protection Standards', 'E-commerce Consumer Protection Standards'),
    ('Standard Merchant Service Level Agreements', 'Standard Merchant Service Level Agreements'),
    ("Platform seller liability policy", "Platform seller liability policy"),
    ('under RBI Consumer Protection Guidelines and Standard Merchant Service Level Agreements', 'under RBI Consumer Protection Guidelines and Standard E-commerce Merchant Agreements'),
    ('', '')
]

def process_file(filepath):
    if not filepath.endswith(('.js', '.jsx', '.json', '.md', '.py', '.txt', '.env')):
        return
    if 'node_modules' in filepath or '.git' in filepath:
        return
        
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
        
        # In backend files, apply specific replacements first
        # But wait, we should apply specific replacements everywhere first, then the generic ones
        for old, new in replacements:
            content = content.replace(old, new)
            
        if 'server' in filepath.replace('\\', '/') or 'test-api.js' in filepath or 'cognee_server.py' in filepath:
            content = content.replace('Paytm', 'Nyaya')
            content = content.replace('paytm', 'nyaya')
            content = content.replace('PAYTM', 'NYAYA')

        if original != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {filepath}')
    except Exception as e:
        print(f'Error processing {filepath}: {e}')

for root, _, files in os.walk('d:/projects/NYAYA'):
    for file in files:
        process_file(os.path.join(root, file))
