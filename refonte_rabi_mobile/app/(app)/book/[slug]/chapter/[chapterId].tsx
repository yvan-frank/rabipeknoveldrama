import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Animated, AppState, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { BottomSheet } from '../../../../../src/components/BottomSheet';
import { Button } from '../../../../../src/components/Button';
import { ChapterCommentsSection } from '../../../../../src/components/ChapterCommentsSection';
import { ReaderTutorialOverlay } from '../../../../../src/components/ReaderTutorialOverlay';
import { showToast } from '../../../../../src/components/Toast';
import { useAuthStore } from '../../../../../src/auth/auth-store';
import { useAgeVerificationStore } from '../../../../../src/lib/age-verification-store';
import { extractApiErrorMessage } from '../../../../../src/api/client';
import { addReadingTime, getChapterUnlockCost, getPointsBalance, unlockChapterWithPoints } from '../../../../../src/api/points';
import { fetchBookBySlug } from '../../../../../src/api/books';
import { fetchChapter, fetchReadingProgress, saveReadingProgress } from '../../../../../src/api/chapters';
import { flattenChapters, type ChapterEntry } from '../../../../../src/lib/chapter-access';
import { useReaderOnboardingStore } from '../../../../../src/reader/reader-onboarding-store';
import {
  DIM_OPACITIES,
  READER_THEMES,
  dimOpacityFromIndex,
  fontSizeFromIndex,
  fontStackFromChoice,
  lineHeightFromIndex,
  useReaderPrefsStore,
  type ReadingFontChoice,
} from '../../../../../src/reader/reader-prefs-store';
import { readerPalette, type ReaderThemeName } from '../../../../../src/theme/tokens';
import { useTheme } from '../../../../../src/theme/useTheme';

const THEME_LABELS: Record<ReaderThemeName, string> = { light: 'Clair', dark: 'Sombre', paper: 'Papier', sepia: 'Sépia' };
const PROGRESS_SAVE_DEBOUNCE_MS = 1200;
// Cadence d'envoi du temps de lecture cumulé (cf. tâches bonus "Lire 15/30
// min", POST /points/reading-time) — par petits paquets plutôt qu'en continu.
const READING_TIME_REPORT_INTERVAL_S = 20;

// -- Construction du HTML du lecteur -----------------------------------------
// Deux modes : "paginated" (feuilleter) et "scroll" (défiler classique). Le
// choix du panneau Aa bascule entre les deux.
//
// "paginated" a été tenté trois fois avec des colonnes CSS (column-width +
// overflow-x:scroll, magnétisme JS) : le rendu des colonnes CSS combiné au
// scroll horizontal s'est montré peu fiable selon les moteurs de WebView
// (largeur réelle de colonne imprécise, page suivante partiellement visible),
// indépendamment des calculs de largeur essayés. Architecture retenue à la
// place : de vraies fenêtres DOM. Le contenu est mis en page une seule fois,
// normalement (un seul bloc qui coule), on mesure sa hauteur réelle rendue
// pour découper des pages exactes en hauteur de viewport, puis on affiche
// chaque page via une fenêtre `overflow:hidden` de taille pile écran qui
// montre une tranche du contenu (translateY interne) — 3 fenêtres (précédente/
// courante/suivante) recyclées à chaque changement de page, empilées côte à
// côte horizontalement et glissées au doigt. Chaque frontière de page est
// ainsi garantie pixel-parfaite par construction, sans dépendre du rendu des
// colonnes CSS.
function buildEndBlockHtml(nextEntry: ChapterEntry | null | undefined) {
  const label = !nextEntry ? 'Retour à la fiche' : nextEntry.locked ? 'Acheter pour continuer' : 'Chapitre suivant';
  return `<div class="end-block">
    <div class="end-icon">📖</div>
    <div class="end-title">Fin du chapitre</div>
    <button class="next-btn" onclick="event.stopPropagation(); window.ReactNativeWebView.postMessage(JSON.stringify({type:'next'}));">${label}</button>
  </div>`;
}

function baseStyles(options: { fontFamily: string; fontSize: number; lineHeight: number; background: string; color: string; accent: string }) {
  return `
    html, body { margin: 0; padding: 0; background: ${options.background}; }
    /* Contenu payant : sélection désactivée pour empêcher la copie (cf.
       usePreventScreenCapture côté RN pour la capture d'écran). -webkit-touch-callout
       coupe aussi le menu contextuel iOS (Copier/Rechercher) au appui long. */
    * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    body {
      font-family: ${options.fontFamily};
      font-size: ${options.fontSize}px;
      line-height: ${options.lineHeight};
      color: ${options.color};
    }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    p { margin: 0 0 1.1em; }
    .end-block { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%; padding: 0 32px; box-sizing: border-box; }
    .end-icon { font-size: 40px; margin-bottom: 16px; }
    .end-title { font-weight: 600; margin-bottom: 20px; opacity: 0.85; }
    .next-btn { background: ${options.accent}; color: #fff; border: none; border-radius: 999px; padding: 14px 28px; font-size: 15px; font-weight: 700; font-family: ${options.fontFamily}; }
  `;
}

function buildPaginatedHtml(content: string, options: {
  fontFamily: string; fontSize: number; lineHeight: number; background: string; color: string; accent: string; resumePercent: number; nextEntry: ChapterEntry | null | undefined; topInset: number; bottomInset: number;
}) {
  // Le header et la barre du bas (+ la status bar Android) sont des overlays
  // absolus par-dessus une WebView plein écran (pas des éléments qui
  // réduisent sa taille). Cette réserve DOIT vivre sur .page-clip (la fenêtre
  // visible de CHAQUE page), pas dans le padding du flux de contenu : un
  // padding sur #measure/.page-inner ne s'applique qu'une fois, au tout début
  // et à la toute fin du flux entier — seules la 1ère et la dernière page en
  // profiteraient, toutes les pages du milieu iraient jusqu'au bord réel de
  // l'écran (texte caché sous la status bar, coupé en bas, dupliqué ensuite).
  const contentPadding = '0px 24px 0px';
  // Marge de confort supplémentaire, PAR PAGE elle aussi : cf. .page-clip.
  const PAGE_TOP_INSET = options.topInset + 10;
  const PAGE_BOTTOM_INSET = options.bottomInset + 10;
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  ${baseStyles(options)}
  html, body { height: 100%; overflow: hidden; }
  .end-block { height: auto; padding: 48px 24px 20px; }
  #measure {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    visibility: hidden;
    pointer-events: none;
    box-sizing: border-box;
    padding: ${contentPadding};
  }
  #viewport { position: relative; width: 100vw; height: 100%; overflow: hidden; }
  #track { position: absolute; top: 0; left: 0; width: 100vw; height: 100%; }
  /* Les 3 pages sont empilées au même endroit (pas côte à côte) : seule la
     page du dessus (rôle "current") se déplace au doigt, les 2 autres restent
     fixes et immobiles en dessous, révélées progressivement quand la page du
     dessus glisse — l'effet d'une page de livre qu'on soulève, pas d'un tapis
     roulant qui défile. */
  .page { position: absolute; top: 0; left: 0; width: 100vw; height: 100%; background: ${options.background}; }
  .page-clip {
    position: absolute;
    top: ${PAGE_TOP_INSET}px;
    left: 0;
    right: 0;
    bottom: ${PAGE_BOTTOM_INSET}px;
    overflow: hidden;
  }
  .page-inner { position: absolute; top: 0; left: 0; width: 100%; box-sizing: border-box; padding: ${contentPadding}; visibility: hidden; }
  .page-num {
    position: absolute;
    right: 22px;
    bottom: ${PAGE_BOTTOM_INSET + 8}px;
    font-family: ${options.fontFamily};
    font-size: 12px;
    color: ${options.color};
    opacity: 0.35;
    pointer-events: none;
  }
</style></head>
<body>
  <div id="measure">${content}${buildEndBlockHtml(options.nextEntry)}</div>
  <div id="viewport">
    <div id="track">
      <div class="page"><div class="page-clip"><div class="page-inner"></div></div><div class="page-num"></div></div>
      <div class="page"><div class="page-clip"><div class="page-inner"></div></div><div class="page-num"></div></div>
      <div class="page"><div class="page-clip"><div class="page-inner"></div></div><div class="page-num"></div></div>
    </div>
  </div>
  <script>
    var measure = document.getElementById('measure');
    var viewport = document.getElementById('viewport');
    // Rôles FIXES par position DOM (0=précédente, 1=courante, 2=suivante) :
    // seul le contenu affiché change d'une page à l'autre (renderSlots), pas
    // quel élément DOM joue quel rôle — ça garde le glissement (qui, lui,
    // n'agit que sur pages[1]) simple et sans dérive.
    var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
    var slots = Array.prototype.slice.call(document.querySelectorAll('.page-inner'));
    slots.forEach(function (slot) { slot.innerHTML = measure.innerHTML; });
    var pageNums = Array.prototype.slice.call(document.querySelectorAll('.page-num'));
    var CURRENT = pages[1];

    var totalPages = 1;
    var pageStarts = [0]; // pageStarts[i] = offset Y (px) où commence la page i, dans le repère de #measure
    var centerPage = 0;
    var dragging = false;
    var isSwipeGesture = false;
    var startX = 0, startY = 0, startTime = 0, currentDelta = 0;

    // Doit être IDENTIQUE au clip CSS (.page-clip, top/bottom ${PAGE_TOP_INSET}px/${PAGE_BOTTOM_INSET}px) :
    // sinon la fenêtre visible affiche plus (ou moins) de contenu que ce que
    // l'algorithme a budgété pour la page, et le surplus réapparaît dupliqué
    // en haut de la page suivante.
    var TOP_INSET = ${PAGE_TOP_INSET};
    var BOTTOM_INSET = ${PAGE_BOTTOM_INSET};

    // Round-arithmétique ("page N débute à N × hauteur-de-ligne") suppose un
    // flux parfaitement régulier — faux dès qu'un paragraphe a une marge (ici
    // 1.1em, pas un multiple de la hauteur de ligne) : l'écart s'accumule au
    // fil des paragraphes et la frontière calculée finit par tomber au milieu
    // d'une ligne, qui apparaît alors tranchée. On mesure donc les VRAIES
    // coordonnées de chaque ligne rendue via Range.getClientRects() (une boîte
    // par ligne visuelle, y compris sur un paragraphe qui en contient
    // plusieurs) et on ne coupe jamais qu'entre deux lignes réelles.
    function collectBreakPoints() {
      var containerTop = measure.getBoundingClientRect().top;
      var breaks = [0];
      var walker = document.createTreeWalker(measure, NodeFilter.SHOW_TEXT, null);
      var range = document.createRange();
      var node;
      while ((node = walker.nextNode())) {
        if (!node.textContent || !node.textContent.trim()) continue;
        range.selectNodeContents(node);
        var rects = range.getClientRects();
        for (var i = 0; i < rects.length; i++) {
          breaks.push(rects[i].bottom - containerTop);
        }
      }
      var blocks = measure.querySelectorAll('img, figure, .end-block');
      for (var j = 0; j < blocks.length; j++) {
        breaks.push(blocks[j].getBoundingClientRect().bottom - containerTop);
      }
      breaks.push(measure.scrollHeight);
      breaks.sort(function (a, b) { return a - b; });
      var deduped = [];
      for (var k = 0; k < breaks.length; k++) {
        if (deduped.length === 0 || breaks[k] - deduped[deduped.length - 1] > 1) deduped.push(breaks[k]);
      }
      return deduped;
    }

    function measurePaging() {
      var viewportHeight = viewport.clientHeight || 1;
      var usableHeight = Math.max(1, viewportHeight - TOP_INSET - BOTTOM_INSET);
      var breakPoints = collectBreakPoints();
      var contentEnd = measure.scrollHeight;
      var starts = [0];
      var currentStart = 0;
      var guard = 0;
      while (currentStart < contentEnd - 1 && guard < 5000) {
        guard++;
        var limit = currentStart + usableHeight;
        var chosen = -1;
        for (var b = 0; b < breakPoints.length; b++) {
          if (breakPoints[b] > currentStart + 1 && breakPoints[b] <= limit) chosen = breakPoints[b];
          if (breakPoints[b] > limit) break;
        }
        // Repli (ligne isolée plus haute qu'une page entière) : force un
        // saut pour ne jamais boucler indéfiniment.
        if (chosen === -1) chosen = Math.min(limit, contentEnd);
        starts.push(chosen);
        currentStart = chosen;
      }
      pageStarts = starts;
      totalPages = Math.max(1, starts.length - 1);
    }

    function renderSlots() {
      for (var i = 0; i < 3; i++) {
        var pageIndex = centerPage - 1 + i;
        var inner = slots[i];
        var num = pageNums[i];
        if (pageIndex < 0 || pageIndex >= totalPages) {
          inner.style.visibility = 'hidden';
          num.textContent = '';
        } else {
          inner.style.visibility = 'visible';
          // Pas de + TOP_INSET ici : le décalage visuel est déjà fourni par
          // .page-clip (top: ${PAGE_TOP_INSET}px), qui définit aussi la
          // fenêtre de clip réellement visible — les deux doivent rester en
          // accord, sinon la duplication de lignes réapparaît.
          inner.style.transform = 'translateY(-' + pageStarts[pageIndex] + 'px)';
          num.textContent = String(pageIndex + 1);
        }
      }
    }

    function report() {
      var current = Math.min(totalPages, centerPage + 1);
      // Même formule (0-indexée sur totalPages-1) que celle utilisée pour
      // repositionner centerPage au chargement (cf. plus bas) — un pourcentage
      // calculé différemment à la sauvegarde et à la reprise ("current/total"
      // vs "index/(total-1)") dérive systématiquement d'une page à l'ouverture
      // suivante. Précision décimale conservée (pas de Math.round ici) : la
      // reprise exacte en dépend, cf. progressPercent (Float) côté backend.
      var percent = totalPages > 1 ? (centerPage / (totalPages - 1)) * 100 : 100;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'page', current: current, total: totalPages, percent: percent }));
    }

    // Remet les 3 pages à leur état de repos : empilées à la même position
    // (translateX 0), la page "courante" au-dessus (z-index 3), les 2 autres
    // dessous et invisibles derrière elle — prêtes pour le prochain glissement.
    function resetPageTransforms() {
      pages[0].style.transition = 'none';
      pages[0].style.transform = 'translateX(0)';
      pages[0].style.zIndex = '1';
      pages[0].style.boxShadow = 'none';
      pages[2].style.transition = 'none';
      pages[2].style.transform = 'translateX(0)';
      pages[2].style.zIndex = '1';
      pages[2].style.boxShadow = 'none';
      CURRENT.style.transition = 'none';
      CURRENT.style.transform = 'translateX(0)';
      CURRENT.style.zIndex = '3';
      CURRENT.style.boxShadow = 'none';
    }

    function goToPage(index) {
      centerPage = Math.max(0, Math.min(totalPages - 1, index));
      renderSlots();
      resetPageTransforms();
      report();
    }

    window.addEventListener('load', function () {
      measurePaging();
      var resumePercent = ${options.resumePercent};
      var startPage = 0;
      if (resumePercent > 0 && totalPages > 1) {
        startPage = Math.round((resumePercent / 100) * (totalPages - 1));
      }
      centerPage = Math.max(0, Math.min(totalPages - 1, startPage));
      renderSlots();
      resetPageTransforms();
      report();
    });

    window.addEventListener('resize', function () {
      measurePaging();
      goToPage(centerPage);
    });

    viewport.addEventListener('touchstart', function (event) {
      if (event.target.closest && event.target.closest('.next-btn')) return;
      // Une sélection en cours : on laisse le toucher aux poignées natives
      // plutôt que de tourner la page en dessous.
      var activeSelection = window.getSelection();
      if (activeSelection && activeSelection.toString()) { dragging = false; return; }
      var touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      currentDelta = 0;
      dragging = true;
      isSwipeGesture = false;
      CURRENT.style.transition = 'none';
    }, { passive: true });

    viewport.addEventListener('touchmove', function (event) {
      if (!dragging) return;
      var touch = event.touches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      if (!isSwipeGesture) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dx) <= Math.abs(dy)) { dragging = false; return; }
        isSwipeGesture = true;
        // Choisit MAINTENANT (avant toute révélation perceptible) laquelle
        // des 2 pages de fond passe au-dessus de l'autre, selon le sens du
        // glissement — élément qui apparaîtra "sous" la page courante.
        if (dx < 0) { pages[2].style.zIndex = '2'; pages[0].style.zIndex = '1'; }
        else { pages[0].style.zIndex = '2'; pages[2].style.zIndex = '1'; }
      }
      currentDelta = dx;
      if (centerPage === 0 && dx > 0) currentDelta = dx * 0.35;
      if (centerPage === totalPages - 1 && dx < 0) currentDelta = dx * 0.35;
      CURRENT.style.transform = 'translateX(' + currentDelta + 'px)';
      // Ombre portée par la page qui se soulève, sur le bord qui découvre la
      // page en dessous — l'intensité grandit avec la distance glissée, pour
      // suggérer une vraie feuille qui se détache plutôt qu'un simple slide.
      var shadowOpacity = Math.min(0.4, Math.abs(currentDelta) / 220).toFixed(2);
      var shadowOffset = currentDelta < 0 ? 16 : -16;
      CURRENT.style.boxShadow = shadowOffset + 'px 0 26px -6px rgba(0,0,0,' + shadowOpacity + ')';
    }, { passive: true });

    viewport.addEventListener('touchend', function (event) {
      if (event.target.closest && event.target.closest('.next-btn')) return;
      if (!dragging) return;
      dragging = false;
      if (!isSwipeGesture || Math.abs(currentDelta) < 3) {
        CURRENT.style.transition = 'none';
        CURRENT.style.transform = 'translateX(0)';
        CURRENT.style.boxShadow = 'none';
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tap' }));
        return;
      }
      var elapsed = Math.max(1, Date.now() - startTime);
      var velocity = currentDelta / elapsed;
      var threshold = (viewport.clientWidth || 1) * 0.28;
      var shouldAdvance = Math.abs(currentDelta) > threshold || Math.abs(velocity) > 0.5;
      if (shouldAdvance && currentDelta < 0 && centerPage < totalPages - 1) {
        CURRENT.style.transition = 'transform 220ms ease-out, box-shadow 220ms ease-out';
        CURRENT.style.transform = 'translateX(-100vw)';
        CURRENT.style.boxShadow = '16px 0 26px -6px rgba(0,0,0,0.4)';
        setTimeout(function () { goToPage(centerPage + 1); }, 220);
      } else if (shouldAdvance && currentDelta > 0 && centerPage > 0) {
        CURRENT.style.transition = 'transform 220ms ease-out, box-shadow 220ms ease-out';
        CURRENT.style.transform = 'translateX(100vw)';
        CURRENT.style.boxShadow = '-16px 0 26px -6px rgba(0,0,0,0.4)';
        setTimeout(function () { goToPage(centerPage - 1); }, 220);
      } else {
        CURRENT.style.transition = 'transform 200ms ease-out, box-shadow 200ms ease-out';
        CURRENT.style.transform = 'translateX(0)';
        CURRENT.style.boxShadow = 'none';
      }
    });
  </script>
</body></html>`;
}

function buildScrollHtml(content: string, options: {
  fontFamily: string; fontSize: number; lineHeight: number; background: string; color: string; accent: string; resumePercent: number; nextEntry: ChapterEntry | null | undefined;
}) {
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  ${baseStyles(options)}
  body { padding: 28px 24px 20px; }
  .end-block { height: auto; padding: 48px 24px; }
</style></head>
<body>
  ${content}${buildEndBlockHtml(options.nextEntry)}
  <script>
    window.addEventListener('load', function () {
      var resumePercent = ${options.resumePercent};
      var max = document.body.scrollHeight - window.innerHeight;
      if (resumePercent > 0 && max > 0) window.scrollTo(0, max * (resumePercent / 100));

      var lastSent = 0;
      window.addEventListener('scroll', function () {
        var now = Date.now();
        if (now - lastSent < 300) return;
        lastSent = now;
        var scrollMax = document.body.scrollHeight - window.innerHeight;
        // Précision décimale conservée (pas de Math.round) : sur un chapitre
        // long, 1 point de pourcentage entier peut représenter plusieurs
        // dizaines de pixels — la reprise doit retomber au pixel près, pas
        // "à peu près".
        var percent = scrollMax > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollMax) * 100)) : 100;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll-progress', percent: percent }));
      });
    });
    document.body.addEventListener('click', function (event) {
      if (event.target.closest('.next-btn')) return;
      var activeSelection = window.getSelection();
      if (activeSelection && activeSelection.toString()) return;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tap' }));
    });

  </script>
</body></html>`;
}

// -- Icône de la barre du bas -------------------------------------------------
// Juste l'icône, pas d'intitulé visible (conteneur volontairement plus
// compact) — le label reste pour l'accessibilité (lecteurs d'écran).
function BottomBarButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={styles.bottomBarButton}>
      {icon}
    </Pressable>
  );
}

// Déclarés au niveau module (pas dans SettingsPanel) : un composant recréé à
// chaque rendu perdrait un éventuel état interne et casse ce lint.
function SegButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segButton, { backgroundColor: active ? colors.accent : colors.background, borderColor: colors.border }]}
    >
      <Text style={[typography.captionSemiBold, { color: active ? colors.surface : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

function Stepper({ label, value, onDecrease, onIncrease }: { label: string; value: string; onDecrease: () => void; onIncrease: () => void }) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.stepperRow}>
      <Text style={[typography.body, { color: colors.ink }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={onDecrease} style={[styles.stepButton, { borderColor: colors.border }]}>
          <Ionicons name="remove" size={16} color={colors.ink} />
        </Pressable>
        <Text style={[typography.captionSemiBold, { color: colors.ink, minWidth: 44, textAlign: 'center' }]}>{value}</Text>
        <Pressable onPress={onIncrease} style={[styles.stepButton, { borderColor: colors.border }]}>
          <Ionicons name="add" size={16} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

// -- Chapitre verrouillé (403) : achat classique OU déblocage par points ----
// Étude de faisabilité "points pour lire un chapitre" -> mécanisme réel (cf.
// src/api/points.ts, PointsService::unlockChapterWithPoints côté serveur) :
// complémentaire à l'achat en argent, jamais un substitut — un visiteur ou
// un lecteur au solde insuffisant garde simplement le message d'origine.
function ChapterLockedScreen({ chapterId, message, onUnlocked }: { chapterId: number; message: string; onUnlocked: () => void }) {
  const { colors, spacing, typography } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const [cost, setCost] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([getChapterUnlockCost(), getPointsBalance()])
      .then(([unlockCost, pointsBalance]) => {
        setCost(unlockCost);
        setBalance(pointsBalance.balance);
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  async function handleUnlock() {
    setError(null);
    setIsUnlocking(true);
    try {
      await unlockChapterWithPoints(chapterId);
      showToast('Chapitre débloqué !');
      onUnlocked();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de débloquer ce chapitre'));
    } finally {
      setIsUnlocking(false);
    }
  }

  const canAfford = cost !== null && balance !== null && balance >= cost;

  return (
    <View style={[styles.center, { flex: 1, backgroundColor: colors.background, padding: spacing.lg }]}>
      <Text style={[typography.body, { color: colors.danger, textAlign: 'center', marginBottom: spacing.lg }]}>{message}</Text>

      {isAuthenticated && cost !== null ? (
        <View style={{ width: '100%', maxWidth: 320, marginBottom: spacing.lg, alignItems: 'center' }}>
          <View style={{ height: StyleSheet.hairlineWidth, width: '100%', backgroundColor: colors.border, marginBottom: spacing.lg }} />
          <Text style={[typography.captionSemiBold, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            {balance !== null ? `Votre solde : ${balance} points` : 'Chargement du solde…'}
          </Text>
          {error ? <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' }]}>{error}</Text> : null}
          {canAfford ? (
            <Button label={`Débloquer pour ${cost} points`} onPress={handleUnlock} loading={isUnlocking} />
          ) : (
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
              Solde insuffisant ({cost} points requis) — gagnez-en depuis l&apos;onglet Bonus.
            </Text>
          )}
        </View>
      ) : null}

      <Button label="Retour à la fiche" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}

// -- Panneau "Aa" (police, taille, mise en page, style, opacité, thème) ------
function SettingsPanel() {
  const { colors, spacing, typography } = useTheme();
  const fontSizeIndex = useReaderPrefsStore((s) => s.fontSizeIndex);
  const lineHeightIndex = useReaderPrefsStore((s) => s.lineHeightIndex);
  const themeOverride = useReaderPrefsStore((s) => s.themeOverride);
  const fontChoice = useReaderPrefsStore((s) => s.fontChoice);
  const layoutMode = useReaderPrefsStore((s) => s.layoutMode);
  const dimIndex = useReaderPrefsStore((s) => s.dimIndex);
  const increaseFontSize = useReaderPrefsStore((s) => s.increaseFontSize);
  const decreaseFontSize = useReaderPrefsStore((s) => s.decreaseFontSize);
  const increaseLineHeight = useReaderPrefsStore((s) => s.increaseLineHeight);
  const decreaseLineHeight = useReaderPrefsStore((s) => s.decreaseLineHeight);
  const setThemeOverride = useReaderPrefsStore((s) => s.setThemeOverride);
  const setFontChoice = useReaderPrefsStore((s) => s.setFontChoice);
  const setLayoutMode = useReaderPrefsStore((s) => s.setLayoutMode);
  const increaseDim = useReaderPrefsStore((s) => s.increaseDim);
  const decreaseDim = useReaderPrefsStore((s) => s.decreaseDim);

  return (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <Text style={[typography.label, { color: colors.textMuted, marginBottom: 8 }]}>POLICE DE LECTURE</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
        <SegButton active={fontChoice === 'serif'} label="Serif" onPress={() => setFontChoice('serif' as ReadingFontChoice)} />
        <SegButton active={fontChoice === 'sans'} label="Sans-serif" onPress={() => setFontChoice('sans' as ReadingFontChoice)} />
      </View>

      <Stepper label="Taille du texte" value={`${fontSizeFromIndex(fontSizeIndex)}`} onDecrease={decreaseFontSize} onIncrease={increaseFontSize} />
      <Stepper
        label="Mise en page (interligne)"
        value={lineHeightFromIndex(lineHeightIndex).toFixed(1)}
        onDecrease={decreaseLineHeight}
        onIncrease={increaseLineHeight}
      />
      <Stepper
        label="Opacité (assombrir)"
        value={`${Math.round(dimOpacityFromIndex(dimIndex) * 100)}%`}
        onDecrease={decreaseDim}
        onIncrease={increaseDim}
      />

      <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.md, marginBottom: 8 }]}>STYLE DE LECTURE</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
        <SegButton active={layoutMode === 'paginated'} label="Feuilleter" onPress={() => setLayoutMode('paginated')} />
        <SegButton active={layoutMode === 'scroll'} label="Défiler" onPress={() => setLayoutMode('scroll')} />
      </View>

      <Text style={[typography.label, { color: colors.textMuted, marginBottom: 8 }]}>THÈME</Text>
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: spacing.md }}>
        {READER_THEMES.map((themeName) => {
          const swatch = readerPalette[themeName];
          const isSelected = (themeOverride ?? 'light') === themeName;
          return (
            <Pressable key={themeName} onPress={() => setThemeOverride(themeOverride === themeName ? null : themeName)} style={{ alignItems: 'center' }}>
              <View
                style={[
                  styles.themeSwatch,
                  { backgroundColor: swatch.background, borderColor: isSelected ? colors.accent : colors.border, borderWidth: isSelected ? 2 : 1 },
                ]}
              >
                <Text style={{ color: swatch.ink, fontSize: 11 }}>Aa</Text>
              </View>
              <Text style={[typography.label, { color: isSelected ? colors.accent : colors.textMuted, marginTop: 3 }]}>{THEME_LABELS[themeName]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ChapterReaderScreen() {
  const { slug, chapterId } = useLocalSearchParams<{ slug: string; chapterId: string }>();
  const { colors, spacing, typography, scheme } = useTheme();
  const queryClient = useQueryClient();
  const fontSizeIndex = useReaderPrefsStore((s) => s.fontSizeIndex);
  const lineHeightIndex = useReaderPrefsStore((s) => s.lineHeightIndex);
  const themeOverride = useReaderPrefsStore((s) => s.themeOverride);
  const fontChoice = useReaderPrefsStore((s) => s.fontChoice);
  const layoutMode = useReaderPrefsStore((s) => s.layoutMode);
  const dimIndex = useReaderPrefsStore((s) => s.dimIndex);

  const readerTheme: ReaderThemeName = themeOverride ?? (scheme === 'dark' ? 'dark' : 'light');
  const readerColors = readerPalette[readerTheme];

  // Header/barre du bas mesurés réellement (plutôt que devinés) pour que la
  // pagination réserve exactement l'espace qu'ils recouvrent, quel que soit
  // l'appareil (encoche, barre de gestes, etc.).
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(insets.top + 48);
  const [bottomBarHeight, setBottomBarHeight] = useState(insets.bottom + 74);

  const hasSeenReaderTutorial = useReaderOnboardingStore((s) => s.hasSeenReaderTutorial);
  const markReaderTutorialSeen = useReaderOnboardingStore((s) => s.markReaderTutorialSeen);

  // Contenu payant : ni capture d'écran/enregistrement (cf. usePreventScreenCapture
  // ci-dessous) ni sélection de texte/copie (CSS user-select: none injecté dans
  // la WebView, cf. baseStyles) — l'ancienne barre d'actions Copier/Partager sur
  // sélection n'a donc plus lieu d'être.
  usePreventScreenCapture('chapter-reader');

  // Comptabilise le temps de lecture actif pour les tâches bonus "Lire 15/30
  // min" (cf. GET/POST /points/reading-time) — un minuteur local accumule les
  // secondes tant que cet écran est monté ET l'app au premier plan (une pub
  // regardée en arrière-plan ou l'écran verrouillé ne doit rien compter),
  // rapportées par paquets de READING_TIME_REPORT_INTERVAL_S plutôt qu'en
  // continu. /points/* exige une session : rien à rapporter pour un visiteur.
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const pendingReadingSecondsRef = useRef(0);
  useEffect(() => {
    if (!isAuthenticated) return;

    let appActive = AppState.currentState === 'active';
    const appStateSub = AppState.addEventListener('change', (next) => {
      appActive = next === 'active';
    });

    const tick = setInterval(() => {
      if (!appActive) return;
      pendingReadingSecondsRef.current += 1;
      if (pendingReadingSecondsRef.current >= READING_TIME_REPORT_INTERVAL_S) {
        const seconds = pendingReadingSecondsRef.current;
        pendingReadingSecondsRef.current = 0;
        addReadingTime(seconds).catch(() => {
          // Échec silencieux (ex. hors-ligne) : pas grave de perdre un
          // incrément de 20s, le suivant suivra sans intervention.
        });
      }
    }, 1000);

    return () => {
      clearInterval(tick);
      appStateSub.remove();
      // Reste (< 20s) au moment de quitter le chapitre : plutôt que de le
      // perdre, un dernier envoi partiel.
      if (pendingReadingSecondsRef.current > 0) {
        addReadingTime(pendingReadingSecondsRef.current).catch(() => undefined);
        pendingReadingSecondsRef.current = 0;
      }
    };
  }, [isAuthenticated]);

  const numericChapterId = Number(chapterId);

  const chapterQuery = useQuery({ queryKey: ['chapter', numericChapterId], queryFn: () => fetchChapter(numericChapterId) });
  const bookQuery = useQuery({ queryKey: ['book', slug], queryFn: () => fetchBookBySlug(slug) });
  const progressQuery = useQuery({
    queryKey: ['reading-progress', chapterQuery.data?.bookId],
    queryFn: () => fetchReadingProgress(chapterQuery.data!.bookId),
    enabled: !!chapterQuery.data,
  });

  // Un chapitre peut être ouvert directement (lien profond, notification,
  // "reprendre la lecture" du tableau de bord) sans passer par la fiche
  // livre — sans ce garde, le mur d'âge de book/[slug].tsx serait
  // contournable pour un livre 18+. Redirige vers la fiche, qui affiche
  // elle-même la vérification d'âge tant qu'elle n'est pas confirmée.
  const isAdult = useAgeVerificationStore((s) => s.isAdult);
  useEffect(() => {
    if (bookQuery.data?.isAdultOnly && !isAdult) {
      router.replace(`/book/${slug}`);
    }
  }, [bookQuery.data?.isAdultOnly, isAdult, slug]);

  const chapterEntries = useMemo(() => (bookQuery.data ? flattenChapters(bookQuery.data) : []), [bookQuery.data]);
  const currentIndex = chapterEntries.findIndex((entry) => entry.chapter.id === numericChapterId);
  const nextEntry = currentIndex >= 0 && currentIndex < chapterEntries.length - 1 ? chapterEntries[currentIndex + 1] : null;

  // Immersion : le tap dans la WebView (cf. postMessage 'tap') bascule
  // l'affichage du header et de la barre du bas.
  const [chromeVisible, setChromeVisible] = useState(true);
  const [chromeAnim] = useState(() => new Animated.Value(1));
  useEffect(() => {
    Animated.timing(chromeAnim, { toValue: chromeVisible ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [chromeVisible, chromeAnim]);

  const [activePanel, setActivePanel] = useState<'chapters' | 'settings' | 'comments' | null>(null);
  const [pageInfo, setPageInfo] = useState<{ current: number; total: number } | null>(null);
  const [renderedChapterId, setRenderedChapterId] = useState(numericChapterId);
  if (renderedChapterId !== numericChapterId) {
    setRenderedChapterId(numericChapterId);
    setPageInfo(null);
    setChromeVisible(true);
  }

  // Ne dépend QUE de chapterQuery.data (pas de progressQuery.data) : le HTML
  // ci-dessous n'est reconstruit qu'une fois par chapitre, donc un
  // rafraîchissement ultérieur de la progression (ex. après un
  // saveReadingProgress) ne fait jamais "sauter" le lecteur en arrière. Pour
  // que la valeur figée soit la bonne dès le premier rendu, l'écran de
  // chargement ci-dessous attend que progressQuery soit résolue elle aussi.
  const resumePercent =
    progressQuery.data?.chapterRead === chapterQuery.data?.chapterNumber ? (progressQuery.data?.progressPercent ?? 0) : 0;

  function goToChapter(id: number) {
    router.replace(`/book/${slug}/chapter/${id}`);
  }

  function handleNext() {
    if (nextEntry && !nextEntry.locked) goToChapter(nextEntry.chapter.id);
    else router.push(`/book/${slug}`);
  }

  async function handleShare() {
    if (!chapterQuery.data) return;
    await Share.share({ message: `${chapterQuery.data.title} — Chapitre ${chapterQuery.data.chapterNumber} sur Rabipek` });
  }

  const html = useMemo(() => {
    if (!chapterQuery.data) return '';
    const opts = {
      fontFamily: fontStackFromChoice(fontChoice),
      fontSize: fontSizeFromIndex(fontSizeIndex),
      lineHeight: lineHeightFromIndex(lineHeightIndex),
      background: readerColors.background,
      color: readerColors.ink,
      accent: colors.accent,
      resumePercent,
      nextEntry,
    };
    return layoutMode === 'paginated'
      ? buildPaginatedHtml(chapterQuery.data.content, { ...opts, topInset: headerHeight, bottomInset: bottomBarHeight })
      : buildScrollHtml(chapterQuery.data.content, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterQuery.data, fontChoice, fontSizeIndex, lineHeightIndex, readerColors, colors.accent, layoutMode, nextEntry, headerHeight, bottomBarHeight]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type: string;
        current?: number;
        total?: number;
        percent?: number;
      };
      if (payload.type === 'tap') {
        setChromeVisible((visible) => !visible);
      } else if (payload.type === 'next') {
        handleNext();
      } else if (payload.type === 'page' && payload.current && payload.total && chapterQuery.data) {
        setPageInfo({ current: payload.current, total: payload.total });
        // Pourcentage calculé côté WebView (cf. report()), pas recalculé ici :
        // seule la formule utilisée là-bas est garantie symétrique avec celle
        // de reprise au chargement (startPage), condition d'une réouverture
        // exacte.
        if (typeof payload.percent === 'number') {
          saveReadingProgress(chapterQuery.data.bookId, chapterQuery.data.chapterNumber, payload.percent).catch(() => undefined);
        }
      } else if (payload.type === 'scroll-progress' && typeof payload.percent === 'number' && chapterQuery.data) {
        const percent = payload.percent;
        setTimeout(() => {
          saveReadingProgress(chapterQuery.data!.bookId, chapterQuery.data!.chapterNumber, percent).catch(() => undefined);
        }, PROGRESS_SAVE_DEBOUNCE_MS);
      }
    } catch {
      // Message inattendu — ignoré.
    }
  }

  if (chapterQuery.isLoading || progressQuery.isLoading || bookQuery.isLoading || (bookQuery.data?.isAdultOnly && !isAdult)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (chapterQuery.isError || !chapterQuery.data) {
    const isLocked = axios.isAxiosError(chapterQuery.error) && chapterQuery.error.response?.status === 403;
    if (isLocked) {
      return (
        <ChapterLockedScreen
          chapterId={numericChapterId}
          message={extractApiErrorMessage(chapterQuery.error, 'Ce chapitre est inaccessible')}
          onUnlocked={() => queryClient.invalidateQueries({ queryKey: ['chapter', numericChapterId] })}
        />
      );
    }
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <Text style={[typography.body, { color: colors.danger, textAlign: 'center', marginBottom: spacing.lg }]}>
          {extractApiErrorMessage(chapterQuery.error, 'Ce chapitre est inaccessible')}
        </Text>
        <Button label="Retour à la fiche" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const chapter = chapterQuery.data;
  const chromeTranslateHeader = chromeAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] });
  const chromeTranslateBottom = chromeAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: readerColors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* readerTheme (paper/sépia/clair/sombre) est indépendant du thème
          global de l'app (cf. readerPalette) — la barre de statut doit suivre
          CE fond-ci tant que cet écran est affiché, pas le thème app. */}
      <StatusBar style={readerTheme === 'dark' ? 'light' : 'dark'} />

      <WebView
        key={`${chapter.id}-${layoutMode}-${readerTheme}`}
        originWhitelist={['*']}
        scrollEnabled={layoutMode === 'scroll'}
        source={{ html }}
        onMessage={handleMessage}
        style={{ flex: 1, backgroundColor: readerColors.background }}
      />

      {/* Voile d'assombrissement (confort de lecture), au-dessus de la
          WebView mais sous le header/bottom bar. */}
      {DIM_OPACITIES[dimIndex] ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: dimOpacityFromIndex(dimIndex) }]} />
      ) : null}

      {/* Header immersif : chevron retour, titre + repère de page, partage. */}
      <Animated.View
        pointerEvents={chromeVisible ? 'auto' : 'none'}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        style={[styles.header, { opacity: chromeAnim, transform: [{ translateY: chromeTranslateHeader }], backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
            <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
              <Text style={[typography.bodySemiBold, { color: colors.ink }]} numberOfLines={1}>
                {chapter.title}
              </Text>
              <Text style={[typography.label, { color: colors.textMuted }]}>
                Chapitre {chapter.chapterNumber}
                {layoutMode === 'paginated' && pageInfo ? ` · Page ${pageInfo.current}/${pageInfo.total}` : ''}
              </Text>
            </View>
            <Pressable onPress={handleShare} hitSlop={10}>
              <Ionicons name="share-social-outline" size={21} color={colors.ink} />
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Barre du bas immersive : chapitres, Aa, commentaires. */}
      <Animated.View
        pointerEvents={chromeVisible ? 'auto' : 'none'}
        onLayout={(event) => setBottomBarHeight(event.nativeEvent.layout.height)}
        style={[styles.bottomBar, { opacity: chromeAnim, transform: [{ translateY: chromeTranslateBottom }], backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <SafeAreaView edges={['bottom']}>
          <View style={styles.bottomBarRow}>
            <BottomBarButton icon={<Ionicons name="list" size={22} color={colors.ink} />} label="Chapitres" onPress={() => setActivePanel('chapters')} />
            <BottomBarButton
              icon={<Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>Aa</Text>}
              label="Police"
              onPress={() => setActivePanel('settings')}
            />
            <BottomBarButton
              icon={<Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.ink} />}
              label="Commentaires"
              onPress={() => setActivePanel('comments')}
            />
          </View>
        </SafeAreaView>
      </Animated.View>

      <BottomSheet visible={activePanel === 'chapters'} onClose={() => setActivePanel(null)} title="Chapitres">
        {chapterEntries.map((entry) => (
          <Pressable
            key={entry.chapter.id}
            onPress={() => {
              setActivePanel(null);
              goToChapter(entry.chapter.id);
            }}
            style={[styles.chapterRow, { borderColor: colors.border }]}
          >
            <Text
              style={[typography.body, { color: entry.chapter.id === chapter.id ? colors.accent : colors.ink, flex: 1 }]}
              numberOfLines={1}
            >
              {entry.chapter.chapterNumber}. {entry.chapter.title}
            </Text>
            <Ionicons
              name={entry.locked ? 'lock-closed' : 'lock-open-outline'}
              size={15}
              color={entry.locked ? colors.textMuted : colors.success}
            />
          </Pressable>
        ))}
      </BottomSheet>

      <BottomSheet visible={activePanel === 'settings'} onClose={() => setActivePanel(null)} title="Affichage">
        <SettingsPanel />
      </BottomSheet>

      <BottomSheet visible={activePanel === 'comments'} onClose={() => setActivePanel(null)} variant="transparent" maxHeightRatio={0.92}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <ChapterCommentsSection chapterId={chapter.id} />
        </View>
      </BottomSheet>

      <ReaderTutorialOverlay visible={!hasSeenReaderTutorial} onDismiss={markReaderTutorialSeen} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth },
  bottomBarRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
  bottomBarButton: { alignItems: 'center', justifyContent: 'center', minWidth: 44, paddingVertical: 4 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segButton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  stepButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  themeSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
