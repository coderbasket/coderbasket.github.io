/* Theme Name: The Project - Responsive Website Template
 * Author:HtmlCoder
 * Author URI:http://www.htmlcoder.me
 * Author e-mail:htmlcoder.me@gmail.com
 * Version:1.1.0
 * Created:March 2015
 * License URI:http://support.wrapbootstrap.com/
 * File Description: Place here your custom scripts
 */

//Youtube thumbnail
function get_youtube_thumbnail(url, quality) {
    if (url) {
        var video_id, thumbnail, result;
        if (result = url.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/)) {
            video_id = result.pop();
        }
        else if (result = url.match(/youtu.be\/(.{11})/)) {
            video_id = result.pop();
        }

        if (video_id) {
            if (typeof quality == "undefined") {
                quality = 'high';
            }

            var quality_key = 'maxresdefault'; // Max quality
            if (quality == 'low') {
                quality_key = 'sddefault';
            } else if (quality == 'medium') {
                quality_key = 'mqdefault';
            } else if (quality == 'high') {
                quality_key = 'hqdefault';
            }

            var thumbnail = "http://img.youtube.com/vi/" + video_id + "/" + quality_key + ".jpg";
            return thumbnail;
        }
    }
    return false;
}
//Settings
function BlazorSetLocalStorage(key, value) {
    localStorage.setItem(key, value);
}

function BlazorGetLocalStorage(key) {
    return localStorage.getItem(key);
}

function BlazorRegisterStorageEvent(component) {
    window.addEventListener("storage", async e => {
        await component.invokeMethodAsync("OnStorageUpdated", e.key);
    });
}
// When the user clicks the button, the page scrolls to the top
function OnScrollEvent() {
    document.documentElement.scrollTop = 0;
}
// Single Page Apps for GitHub Pages
// https://github.com/rafrex/spa-github-pages
// Copyright (c) 2016 Rafael Pedicini, licensed under the MIT License
// ----------------------------------------------------------------------
// This script checks to see if a redirect is present in the query string
// and converts it back into the correct url and adds it to the
// browser's history using window.history.replaceState(...),
// which won't cause the browser to attempt to load the new url.
// When the single page app is loaded further down in this file,
// the correct url will be waiting in the browser's history for
// the single page app to route accordingly.
(function (l) {
    if (l.search) {
        var q = {};
        l.search.slice(1).split('&').forEach(function (v) {
            var a = v.split('=');
            q[a[0]] = a.slice(1).join('=').replace(/~and~/g, '&');
        });
        if (q.p !== undefined) {
            window.history.replaceState(null, null,
                l.pathname.slice(0, -1) + (q.p || '') +
                (q.q ? ('?' + q.q) : '') +
                l.hash
            );
        }
    }
}(window.location))

// Clipboard
function copyClipboard(containerid) {
    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(containerid));
        range.select().createTextRange();
        document.execCommand("copy");
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().addRange(range);
        document.execCommand("copy");
        alert("Text has been copied")
    }
}
