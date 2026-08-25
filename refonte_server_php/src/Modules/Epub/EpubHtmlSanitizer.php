<?php

declare(strict_types=1);

namespace App\Modules\Epub;

use DOMDocument;
use DOMElement;
use DOMXPath;
use RuntimeException;

/**
 * Équivalent de prepareChapterContent (epub.service.ts, via cheerio) :
 * assainit le HTML d'un chapitre (retire script/iframe/object/embed et les
 * attributs on*), télécharge chaque image référencée et réécrit son src vers
 * le chemin d'archive local, puis sérialise en XHTML pour l'EPUB. DOMDocument
 * auto-ferme les éléments vides (br/img/hr) lors de la sérialisation XML, ce
 * qui dispense des remplacements regex utilisés côté Node.
 */
final class EpubHtmlSanitizer
{
    private const FORBIDDEN_TAGS = ['script', 'iframe', 'object', 'embed'];

    /**
     * @return array{content:string,assets:list<array{sourceUrl:string,content:string,mediaType:string,extension:string,archivePath:string}>}
     */
    public static function prepareChapter(string $html, int $chapterNumber, string $language): array
    {
        $dom = new DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><div id="rabipek-epub-root">' . $html . '</div></body></html>',
            LIBXML_NONET,
        );
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $root = $xpath->query('//*[@id="rabipek-epub-root"]')->item(0);
        if (!$root instanceof DOMElement) {
            throw new RuntimeException("Contenu de chapitre illisible");
        }

        foreach (self::FORBIDDEN_TAGS as $tag) {
            $nodes = iterator_to_array($root->getElementsByTagName($tag));
            foreach ($nodes as $node) {
                $node->parentNode?->removeChild($node);
            }
        }

        foreach ($xpath->query('.//*', $root) as $element) {
            if (!$element instanceof DOMElement) {
                continue;
            }
            $toRemove = [];
            foreach ($element->attributes as $attribute) {
                if (stripos($attribute->name, 'on') === 0) {
                    $toRemove[] = $attribute->name;
                }
            }
            foreach ($toRemove as $name) {
                $element->removeAttribute($name);
            }
        }

        $assets = [];
        $images = iterator_to_array($root->getElementsByTagName('img'));
        $imageIndex = 0;
        foreach ($images as $image) {
            /** @var DOMElement $image */
            $source = $image->getAttribute('src');
            if ($source === '') {
                throw new RuntimeException("Chapitre {$chapterNumber} : image sans attribut src");
            }
            $imageIndex++;
            $downloaded = EpubImageFetcher::download($source);
            $archivePath = sprintf('images/chapter-%03d-%03d.%s', $chapterNumber, $imageIndex, $downloaded['extension']);
            $image->setAttribute('src', "../{$archivePath}");
            $assets[] = [...$downloaded, 'archivePath' => $archivePath];
        }

        $innerHtml = '';
        foreach ($root->childNodes as $child) {
            $innerHtml .= $dom->saveXML($child);
        }

        $content = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!DOCTYPE html>\n"
            . '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="' . self::xmlEscape($language) . '" lang="' . self::xmlEscape($language) . '">'
            . '<head><meta charset="utf-8"/><title>Chapitre</title></head><body>' . $innerHtml . '</body></html>';

        return ['content' => $content, 'assets' => $assets];
    }

    public static function xmlEscape(string $value): string
    {
        return str_replace(
            ['&', '<', '>', '"', "'"],
            ['&amp;', '&lt;', '&gt;', '&quot;', '&apos;'],
            $value,
        );
    }
}
