//require('dotenv').config();
const puppeteerCore = require('puppeteer-core');
const puppeteer = require('puppeteer');
const chromeLauncher = require('chrome-launcher');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const request = require('request');
const util = require('util');
const colors = require('colors');

class AmazonScraperModel {

    item = null;

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

    async startPuppeter() {
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
                const url = 'http://amazon.com.mx/dp/';
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

                //*Get description
                let description = await newPage.$eval('#productDescription', (e) => e.innerText)
                    .catch(async (error) => {
                        return "No se encontro descripción del producto.\nError: " + error
                    });

                //*Get short description
                let shortDescription = await newPage.$eval('#feature-bullets', (e) => e.innerText)
                    .catch(async (error) => {
                        return "No se encontro descripción del producto.\nError: " + error
                    });

                //*Get images URL
                let formattedImg = await newPage.click('#landingImage')
                    .then(async () => {
                        return await newPage.$$eval('#altImages img', (imageTemp) => {
                            let formattedImg = [];
                            for (let i = 1; i < imageTemp.length; i++) {
                                if (imageTemp[i].src.includes("AC_US40")) {
                                    formattedImg.push(imageTemp[i].src .replace("_AC_US40_", "_AC_SL1500_"));
                                }
                            }
                            return formattedImg;
                        });
                    })
                    .catch(async () => {
                        await newPage.click('#imgThumbs > span > a');
                        return await newPage.$$eval('#igImage', (imageTemp) => {
                            let formattedImg = [];
                            for (let i = 1; i < imageTemp.length; i++) {
                                if (imageTemp[i].src.includes("AC_US40")) {
                                    formattedImg.push(imageTemp[i].src.replace("_AC_US40_", "_AC_SL1500_"));
                                }
                            }
                            return formattedImg;
                        });
                    });

                //a-expander-content a-expander-partial-collapse-content
                let list= await newPage.$eval('#aplus > div', (e)=>{
                    /* let elementOuter = "";
                    elementOuter += e.innerText;
                    let img = e.getElementsByTagName('img');
                    for (let i = 0; i < img.length; i++) {
                        elementOuter += img[i].outerHTML;
                    }
                    return elementOuter; */
                    return e.innerHTML
                })
                .catch(async (error) => {
                    return "No se encontro descripción larga del producto."
                });
                let longDescription = list.replace(/(\r\n|\n|\r)/gm, "");

                let res = [];
                res['description'] = description;
                res['shortDescription'] = shortDescription;
                res['formattedImg'] = formattedImg;
                res['longDescription'] = longDescription;

                await newPage.close();
                //await browser.close().then(async () => console.log("The page was close!")).catch(async () => console.log("The page was close!"));
                this.item = res;
                resolve(this.item)
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función pageScraper`)
            }
        });
    }

    async getDescription(item = this.item){
        return new Promise(async(resolve, reject) => {
            try{               
                resolve(item.description)
            }catch(e){
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getDescription`)
            }
        });
    }

    async getShortDescription(item = this.item){
        return new Promise(async(resolve, reject) => {
            try{
                
                resolve(item.shortDescription);
            }catch(e){
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getShortDescription`)
            }
        });
    }
    
    async getLongDescription(item = this.item){
        return new Promise(async(resolve, reject) => {
            try{
                
                resolve(item.longDescription);
            }catch(e){
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getLongDescription`)
            }
        });
    }

    async getImages(item = this.item){
        return new Promise(async(resolve, reject) => {
            try{
                let img = [];
                for (let i = 0; i < item.formattedImg.length; i++) {
                    const element = item.formattedImg[i];
                    let a ={
                        "src": item.formattedImg[i],
                    };
                    img.push(a);
                }
                resolve(img);
            }catch(e){
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getImages`)
            }
        });
    }

}

module.exports = AmazonScraperModel;