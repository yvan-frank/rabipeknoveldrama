import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '../theme/useTheme';

interface Props {
  value: string; // HTML — même format que le contenu stocké côté API (cf. ChaptersSchema::create).
  onChange: (html: string) => void;
  minHeight?: number;
}

interface ToolbarAction {
  key: string;
  label: string;
  command: string;
  arg?: string;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { key: 'bold', label: 'G', command: 'bold' },
  { key: 'italic', label: 'I', command: 'italic' },
  { key: 'h2', label: 'H2', command: 'formatBlock', arg: 'H2' },
  { key: 'p', label: '¶', command: 'formatBlock', arg: 'P' },
  { key: 'ul', label: '•', command: 'insertUnorderedList' },
  { key: 'ol', label: '1.', command: 'insertOrderedList' },
  { key: 'highlight', label: '✦', command: 'hiliteColor', arg: '#F5C453' },
];

// HTML/JS inline (pas de CDN — la WebView tourne hors-ligne comme le
// lecteur, cf. app/(app)/book/[slug]/chapter/[chapterId].tsx) : une simple
// div contenteditable pilotée par document.execCommand, exactement le
// mécanisme qu'utilisent les libs RN dédiées (ex. react-native-pell-rich-editor)
// sous le capot — pas besoin d'en ajouter une pour ça.
function buildHtml(initialContent: string, colors: { background: string; ink: string }) {
  const safeInitial = initialContent && initialContent.trim() !== '' ? initialContent : '<p></p>';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html,body{margin:0;padding:0;background:${colors.background};}
  body{font-family:-apple-system,Roboto,sans-serif;font-size:16px;line-height:1.6;color:${colors.ink};padding:14px;-webkit-text-size-adjust:100%;}
  #editor{min-height:200px;outline:none;}
  #editor h2{font-size:19px;font-weight:700;margin:14px 0 6px;}
  #editor p{margin:0 0 10px;}
  #editor ul,#editor ol{padding-left:22px;margin:0 0 10px;}
</style></head>
<body>
  <div id="editor" contenteditable="true">${safeInitial}</div>
  <script>
    var editor = document.getElementById('editor');
    function post(type, payload) {
      window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, payload || {})));
    }
    editor.addEventListener('input', function () {
      post('change', { html: editor.innerHTML });
    });
    // Message natif -> WebView : iOS livre sur window, Android sur document
    // (cf. doc react-native-webview) — les deux écouteurs sont nécessaires.
    function handleNative(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'exec') {
          editor.focus();
          document.execCommand(msg.command, false, msg.arg || null);
          post('change', { html: editor.innerHTML });
        }
      } catch (e) {}
    }
    document.addEventListener('message', handleNative);
    window.addEventListener('message', handleNative);
  </script>
</body></html>`;
}

export function RichTextEditor({ value, onChange, minHeight = 220 }: Props) {
  const { colors, radius } = useTheme();
  const webviewRef = useRef<WebView>(null);
  // Construit une seule fois (initialiseur useState) : le contenu initial
  // vient du parent au montage (l'écran appelant n'affiche l'éditeur qu'une
  // fois le chapitre chargé, cf. ChapterEditorScreen) — reconstruire le HTML
  // à chaque frappe casserait le curseur en réinjectant tout le document.
  const [html] = useState(() => buildHtml(value, { background: colors.surface, ink: colors.ink }));

  function exec(command: string, arg?: string) {
    const payload = JSON.stringify({ type: 'exec', command, arg });
    // postMessage direct (Android) + injectJavaScript de secours (iOS, où
    // WebView.postMessage n'est pas toujours livré de façon fiable à un
    // contenu chargé via `source={{html}}` plutôt qu'une vraie URL).
    webviewRef.current?.postMessage(payload);
    webviewRef.current?.injectJavaScript(`handleNative({ data: ${JSON.stringify(payload)} }); true;`);
  }

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; html?: string };
      if (msg.type === 'change' && typeof msg.html === 'string') onChange(msg.html);
    } catch {
      // Message inattendu — ignoré.
    }
  }

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 4,
          padding: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        {TOOLBAR_ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => exec(action.command, action.arg)}
            style={{
              width: 34,
              height: 34,
              borderRadius: radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 13, color: colors.ink }}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        style={{ height: minHeight, backgroundColor: colors.surface }}
        keyboardDisplayRequiresUserAction={false}
      />
    </View>
  );
}
