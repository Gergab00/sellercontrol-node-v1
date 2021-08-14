//require('dotenv').config();
const puppeteerCore = require('puppeteer-core');
const puppeteer = require('puppeteer');
const chromeLauncher = require('chrome-launcher');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const request = require('request');
const util = require('util');
const colors = require('colors');

class AmazonScraperModel {

    async startBrowser(url = 'chrome://apps/') {
        return new Promise(async (resolve, reject) => {
            let browser;
            try {
                const opts = {
                    startingUrl: url,
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
                browser = await puppeteerCore.connect({
                    browserWSEndpoint: webSocketDebuggerUrl,
                    defaultViewport: null
                });
                resolve(browser);
            } catch (err) {
                console.log("Could not create a browser instance => : ", err);
                reject("Could not create a browser instance => : ", err)
            }
        });
    }

    async startPuppeterr() {
        return new Promise(async (resolve, reject) => {
            try {
                const browser = await puppeteer.launch();
                resolve(browser)
            } catch (err) {
                console.log("Could not create a browser instance => : ", err);
                reject("Could not create a browser instance => : ", err)
            }
        });
    }

    async pageScraper(browser, asin) {
        return new Promise(async (resolve, reject) => {
            try {
                let url = 'http://amazon.com.mx/dp/';
                let newPage = await browser.newPage();
                await newPage.setDefaultNavigationTimeout(60000);
                await newPage.goto(url + asin);
                await newPage.waitForTimeout(3000)
                .then(() => console.log(colors.bold.green('Waited a second! The page are loading...\n¡Espera un segundo! La página se está cargando ...')));
                let lastPosition = await scrollPageToBottom(newPage, 500, 50);
                console.log(`Finish Scroll at: ${lastPosition}`);
                await newPage.click(`a[title="Ver opciones de compra"]`)
                .catch(async () => {
                    console.log('Fallo click en a[title="Ver opciones de compra"]');
                    await newPage.click(`#olp_feature_div > div.a-section.a-spacing-small.a-spacing-top-small > span > a`)
                    .catch(async () => {
                        console.log("Fallo click en #olp_feature_div");
                        await newPage.click("#landingImage")
                        .catch(async () => {
                            console.log("Fallo click en #landingImage");
                            newPage.close();
                            resolve("No existe la pagina del producto")
                        });
                    });
                });
                await newPage.waitForSelector('#aod-offer-list', {
                    timeout: 5000
                })
                .catch(() => console.log("There is no selector #aod-offer-list\nNo existe el selector #aod-offer-list"));

                resolve()
            } catch (e) {
                reject(e)
            }
        });
    }

}

module.exports = AmazonScraperModel;