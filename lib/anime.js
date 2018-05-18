/**
 * Anime.js
 * Fetches a MyAnimeList's anime into JSON format.
 *
 * Author: MizoPro
 */

const request = require('request');
const cheerio = require('cheerio');

exports = module.exports = function(id) {
    return new Promise((resolve, reject) => {
        if (typeof id === "undefined" || id === null) {
            resolve(null);
            return;
        }
        const url = "https://myanimelist.net/anime/" + id;
        request(url, (err, res, body) => {
            if (err) reject(err);
            else if (res && res.statusCode) {
                switch (res.statusCode) {
                    case 200:
                        resolve(parseAnime(id, url, body));
                        break;
                    default:
                        resolve(null);
                }
            } else reject(new Error(''));
        });
    });
};

function parseAnime(id, url, data) {
    const $ = cheerio.load(data);
    const anime = {
        media: 'anime',
        id: id,
        title: $('h1.h1').find('span[itemprop="name"]').text(),
        canonical: url,
        image: $('img.ac[itemprop="image"]').attr('src'),
        synopsis: $('span[itemprop="description"]').text()
    };

    const infoLabels = {
        "english": split,
        "synonyms": split,
        "japanese": split,
        "type": 0,
        "episodes": number,
        "status": 0,
        "aired": 0,
        "premiered": 0,
        "broadcast": 0,
        "producers": splitLinks,
        "licensors": splitLinks,
        "studios": splitLinks,
        "source": 0,
        "genres": splitLinks,
        "duration": 0,
        "rating": 0,
        "score": score,
        "ranked": ranked,
        "popularity": popularity,
        "members": number,
        "favorites": number
    };

    const infoElems = $('span.dark_text');

    infoElems.each((i, elem) => {
        const item = $(elem);
        const label = item.text().trim().replace(/[:]/g, '').toLowerCase();
        if (infoLabels.hasOwnProperty(label)) {
            let fn = infoLabels[label];
            typeof fn !== "function" && (fn = function(par) {
                return par.text().trim();
            });
            let parent = item.parent();//.parent('div').text().replace(item.text(), '');
            parent.find('span.dark_text').remove()
            parent.find('sup').remove();
            anime[label] = fn(parent);
        }
    });

    anime.related = {};
    $('table.anime_detail_related_anime').find('tr').each((i, elem) => {
        const item = $(elem);
        const relation = item.find('td:first-child').text().slice(0, -1).toLowerCase().replace(/\s/g, '_');
        const rels = item.find('a[href]');
        anime.related[relation] = relationAnime(rels);
    });
    return anime;

    function relationAnime(elems) {
        function relation(e) {
            return {
                id: parseInt(e.attr('href').replace(/^\/?(?:anime|manga)\/(\d+)\/.*?$/gi, "$1")),
                title: e.text()
            };
        }
        if (elems.length === 1)
            return relation(elems);

        const rels = []
        elems.each((i, elem) => rels.push(relation($(elem))));
        return rels;
    }

    function split(s) {
        return s.text().trim().split(', ').map(elem => elem.trim());
    }

    function splitLinks(s) {
        return /None found, add some/i.test(s.text().trim()) ? [] : split(s);
    }

    function score(s) {
        return {
            value: float(s.find('span[itemprop="ratingValue"]').text()),
            count: number(s.find('span[itemprop="ratingCount"]')),
            best: integer(s.find('meta[itemprop="bestRating"]').attr('content')),
            worst: integer(s.find('meta[itemprop="worstRating"]').attr('content'))
        };
    }

    function ranked(s) {
        s.find('div').remove();
        return popularity(s);
    }

    function popularity(s) {
        return integer(s.text().trim().replace(/,/g, '').replace(/#(\d+)/g, "$1"));
    }

    function number(s) {
        return integer(s.text().trim().replace(/,/g, ''));
    }

    function integer(n) {
        return isNaN(parseInt(n)) ? n : parseInt(n);
    }

    function float(n) {
        return isNaN(parseFloat(n)) ? n : parseFloat(n);
    }
}
