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
                        resolve(parseAnime(id, body));
                        break;
                    default:
                        resolve(null);
                }
            } else reject(new Error(''));
        });
    });
};

function parseAnime(id, data) {
    const $ = cheerio.load(data);
    const anime = {
        media: 'anime',
        id: id,
        title: $('h1.h1').find('span[itemprop="name"]').text(),
        image: $('img.ac[itemprop="image"]').attr('src')
    };
    anime.related = {};
    $('table.anime_detail_related_anime').find('tr').each((i, elem) => {
        const item = $(elem);
        const relation = item.find('td:first-child').text();

        var related = item.find('td:last-child');
        var media;
        if (related.children().length === 1) {
            media = relationAnime(related.find('a[href]'));
        } else {
            media = [];
            related.each((i, elem) => {
                media.push(relationAnime($(elem)));
            });
        }
        anime.related[relation] = media;
    });
    return anime;
}

function relationAnime(elem) {
    return {
        id: parseInt(elem.attr('href').replace(/^\/?(?:anime|manga)\/(\d+)\/.*?$/gi, "$1")),
        title: elem.text()
    }
}
