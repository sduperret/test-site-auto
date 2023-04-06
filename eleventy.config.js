const {DateTime} = require("luxon");
const markdownItAnchor = require("markdown-it-anchor");
const chalk = require("chalk")

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginBundle = require("@11ty/eleventy-plugin-bundle");
const pluginNavigation = require("@11ty/eleventy-navigation");
const {EleventyHtmlBasePlugin} = require("@11ty/eleventy");
const {EleventyI18nPlugin} = require("@11ty/eleventy");

const translations = require('./_data/i18n');

module.exports = function (eleventyConfig) {
    // Copy the contents of the `public` folder to the output folder
    // For example, `./public/css/` ends up in `_site/css/`
    eleventyConfig.addPassthroughCopy({
        "./public/": "/",
        './node_modules/@gouvfr/dsfr/dist/favicon': '/favicon',
        './node_modules/@gouvfr/dsfr/dist/fonts': '/css/fonts',
        './node_modules/@gouvfr/dsfr/dist/icons': '/css/icons',
        './node_modules/@gouvfr/dsfr/dist/dsfr.min.css': '/css/dsfr.min.css',
        './node_modules/@gouvfr/dsfr/dist/utility/utility.min.css': '/css/utility/utility.min.css',
        './node_modules/@gouvfr/dsfr/dist/dsfr.module.min.js': '/js/dsfr.module.min.js',
        './node_modules/@gouvfr/dsfr/dist/dsfr.nomodule.min.js': '/js/dsfr.nomodule.min.js',
        './node_modules/@gouvfr/dsfr/dist/artwork': '/artwork'
    });

    // Run Eleventy when these files change:
    // https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

    // Watch content images for the image pipeline.
    eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

    // App plugins
    eleventyConfig.addPlugin(require("./eleventy.config.drafts.js"));
    eleventyConfig.addPlugin(require("./eleventy.config.images.js"));
    eleventyConfig.addPlugin(EleventyI18nPlugin, {
        defaultLanguage: "fr",
    });

    // Official plugins
    eleventyConfig.addPlugin(pluginRss);
    eleventyConfig.addPlugin(pluginSyntaxHighlight, {
        preAttributes: {tabindex: 0}
    });
    eleventyConfig.addPlugin(pluginNavigation);
    eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
    eleventyConfig.addPlugin(pluginBundle);

    // Filters
    eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
        // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
        return DateTime.fromJSDate(dateObj, {zone: zone || "utc"}).toFormat(format || "dd LLLL yyyy");
    });

    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
        // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
        return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
    });

    // Get the first `n` elements of a collection.
    eleventyConfig.addFilter("head", (array, n) => {
        if (!Array.isArray(array) || array.length === 0) {
            return [];
        }
        if (n < 0) {
            return array.slice(n);
        }

        return array.slice(0, n);
    });

    // Return the smallest number argument
    eleventyConfig.addFilter("min", (...numbers) => {
        return Math.min.apply(null, numbers);
    });

    // Return all the tags used in a collection
    eleventyConfig.addFilter("getAllTags", collection => {
        let tagSet = new Set();
        for (let item of collection) {
            (item.data.tags || []).forEach(tag => tagSet.add(tag));
        }
        return Array.from(tagSet);
    });

    eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
        return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
    });

    eleventyConfig.addFilter("i18n", function i18n(key, lang_override) {
        const lang = lang_override || this.page.lang;
        if (!translations[lang][key]) {
            console.warn(chalk.yellow(`[i18n] Could not find '${key}' in '${lang}'.`));
            return key;
        }
        return translations[lang][key];
    });

    eleventyConfig.addFilter("locale_url_fallback", function locale_url_fallback(url, langOverride) {
        let locale_url;
        const lang = langOverride || this.page.lang;
        try {
            locale_url = eleventyConfig.getFilter("locale_url")(url, lang);
        } catch (e) {
            locale_url = `/${lang}/`;
        }
        return locale_url;
    });

    eleventyConfig.addGlobalData("langs", Object.keys(translations));

    // Customize Markdown library settings:
    eleventyConfig.amendLibrary("md", mdLib => {
        mdLib.use(markdownItAnchor, {
            permalink: markdownItAnchor.permalink.ariaHidden({
                placement: "after",
                class: "header-anchor",
                symbol: "#",
                ariaHidden: false,
            }),
            level: [1, 2, 3, 4],
            slugify: eleventyConfig.getFilter("slugify")
        });
    });

    // Automatically strip all leading or trailing whitespace
    // to prevent Markdown lib from rendering with wrapping into paragraphs
    eleventyConfig.setNunjucksEnvironmentOptions({
        trimBlocks: true,
        lstripBlocks: true,
    });

    // Features to make your build faster (when you need them)

    // If your passthrough copy gets heavy and cumbersome, add this line
    // to emulate the file copy on the dev server. Learn more:
    // https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

    // eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

    return {
        // Control which files Eleventy will process
        // e.g.: *.md, *.njk, *.html, *.liquid
        templateFormats: [
            "md",
            "njk",
            "html",
            "liquid"
        ],

        // Pre-process *.md files with: (default: `liquid`)
        markdownTemplateEngine: "njk",

        // Pre-process *.html files with: (default: `liquid`)
        htmlTemplateEngine: "njk",

        // These are all optional:
        dir: {
            input: "content",         // default: "."
            includes: "../_includes",  // default: "_includes"
            data: "../_data",          // default: "_data"
            output: "_site"
        },

        // -----------------------------------------------------------------
        // Optional items:
        // -----------------------------------------------------------------

        // If your site deploys to a subdirectory, change `pathPrefix`.
        // Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

        // When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
        // it will transform any absolute URLs in your HTML to include this
        // folder name and does **not** affect where things go in the output folder.
        pathPrefix: "/",
    };
};
