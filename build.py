# 把 src/ 內的 CSS、JS 與 vendor 內嵌成單一 index.html（離線可用、可直接放 GitHub Pages）
import pathlib
d = pathlib.Path(__file__).parent
src = d / 'src'
JS = ['domain.js', 'library-data.js', 'store.js', 'core.js', 'folder.js', 'docgen.js', 'ca07-rules.js', 'ca07-docs.js', 'ca07-share.js', 'app.js', 'ca07-pages.js', 'ca07-voice.js', 'pages-lib.js', 'ca07-demo.js']
html = (src / 'index.html').read_text(encoding='utf-8')
out = (html.replace('/*STYLES*/', (src / 'styles.css').read_text(encoding='utf-8') + (src / 'ca07.css').read_text(encoding='utf-8'))
           .replace('/*VENDOR*/', (src / 'vendor' / 'pptxgen.bundle.js').read_text(encoding='utf-8'))
           .replace('/*SCRIPTS*/', '\n'.join(f'/* ---- {f} ---- */\n' + (src / f).read_text(encoding='utf-8') for f in JS)))
import json
ch = d / 'assets' / 'video' / 'chapters.json'
out = out.replace('/*CHAPTERS*/[]', ch.read_text(encoding='utf-8') if ch.exists() else '[]')
(d / 'index.html').write_text(out, encoding='utf-8')
print('index.html', len(out.encode()), 'bytes')
