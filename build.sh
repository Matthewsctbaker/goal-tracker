#!/bin/bash
# Build step for the Goal Tracker:
#   1. Compile app.jsx -> app.js (offline, via JXA + Babel)
#   2. Stamp a fresh cache-busting version onto every asset URL in index.html
# Run this before every commit/push so users always get the latest code.
set -e
cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"   # parent Goals folder (holds lib/babel.min.js)

# 1. Compile JSX -> JS
osascript -l JavaScript <<EOF
ObjC.import('Foundation');
function rf(p){ return ObjC.unwrap(\$.NSString.stringWithContentsOfFileEncodingError(\$(p).stringByStandardizingPath, \$.NSUTF8StringEncoding, null)); }
function wf(p,s){ \$(s).writeToFileAtomicallyEncodingError(\$(p).stringByStandardizingPath, true, \$.NSUTF8StringEncoding, null); }
(0, eval)(rf('$ROOT/lib/babel.min.js'));
var B = (typeof Babel !== 'undefined') ? Babel : (this.Babel || globalThis.Babel);
var code = B.transform(rf('app.jsx'), {presets:['react']}).code;
wf('app.js', code);
EOF

# 2. Cache-bust: rewrite every ?v=NNN to the current epoch seconds
VER=$(date +%s)
/usr/bin/sed -i '' -E "s/\?v=[0-9]+/?v=$VER/g" index.html
echo "Built app.js and stamped assets with version $VER"
