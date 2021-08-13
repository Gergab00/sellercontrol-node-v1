require('dotenv').config();
const puppeteer = require('puppeteer-core');
const chromeLauncher = require('chrome-launcher');
const request = require('request');
const util = require('util');
const colors = require('colors');

class AmazonScraperModel {

    urlSeller = 'https://sellercentral.amazon.com.mx/home';

    async startBrowser(url) {
        return new Promise(async (resolve, reject) => {
            let browser;
            try {
                const URL = 'chrome://apps/';
                const opts = {
                    startingUrl: URL,
                    chromeFlags: ['--enable-automation', '--start-maximized'],
                    logLevel: 'info',
                    output: 'json'
                };
                // Launch chrome using chrome-launcher.
                const chrome = await chromeLauncher.launch(opts);
                opts.port = chrome.port;
                console.log("Opening the browser......");
                // Connect to it using puppeteer.connect().
                const resp = await util.promisify(request)(`http://localhost:${opts.port}/json/version`);
                const {
                    webSocketDebuggerUrl
                } = JSON.parse(resp.body);
                browser = await puppeteer.connect({
                    browserWSEndpoint: webSocketDebuggerUrl,
                    defaultViewport: null
                });
                resolve(browser);
            } catch (e) {
                console.log("Could not create a browser instance => : ", err);
                reject("Could not create a browser instance => : ", err)
            }
        });
    }
    
}

module.exports = AmazonScraperModel;