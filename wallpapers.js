'use strict'
const { log } = console
const fs = require('fs')
const $ = require('cheerio')
const request = require('request')
const base = 'https://wallhaven.cc'

// Private API
const scrape = async (url, selector, attrib) => {
    let res = await fetch(url)
    let html = await res.text()
    let nodes = $(selector, html)
    return Array.from(nodes).map(n => n.attribs[attrib])
}

const imageId = thumb => thumb.split('/').pop().split('.')[0]

const original = async id => await scrape(`${base}/w/${id}`, 'img#wallpaper', 'src');

const fullImage = async thumb => await original(imageId(thumb))

const thumbnails = async url => await scrape(url, 'figure.thumb img.lazyload', 'data-src') 

const imageList = async (url, html=true) => {
    log('URL:', url)
    let thumbs = await thumbnails(url);
    if (!html) return thumbs;
    return await Promise.all(thumbs.map(thumb => `<img class='thumb' src='${thumb}' />`))
}

const url = ({term='', cat=101, purity=100, width=0, height=0, sort='date_added', order='desc', page=1}) => 
    `${base}/search?q=${term}&categories=${cat}&purity=${purity}${(width && height ? `&atleast=${width}x${height}` : '')}&sorting=${sort}&order=${order}&page=${page}`


// Public API
const images = async ({term='', sort='date_added', width=0, height=0}, html=true) => await imageList(url({term, sort, width, height}), html)

const latest = async (width=0, height=0, html=true, term='') => await images({term, width, height}, html)

const random = async (width=0, height=0, html=true, term='') => await images({term, sort:'random', width, height}, html) 

const toplist = async (width=0, height=0, html=true, term='') => await images({term, sort:'toplist', width, height}, html)

const search = async (width=0, height=0, html=true, term='') => await images({term, sort:'relevance', width, height }, html)

const download = (url, filename, callback) => {
    request.head(url, (err, res, body) => {
        request(url).pipe(fs.createWriteStream(filename)).on('close', () => {
            log("DOWNLOAD COMPLETED!", body, filename)
            callback()
        })
    })
}

module.exports = { toplist, latest, random, search, fullImage, download }
