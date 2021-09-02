//require('dotenv').config();
const puppeteerCore = require('puppeteer-core');
const puppeteer = require('puppeteer');
const chromeLauncher = require('chrome-launcher');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const request = require('request');
const util = require('util');

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
                //console.log("Opening the browser......");
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
                //console.log("Could not create a browser instance => : ", err);
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
                //console.log("Could not create a browser instance => : ", err);
                reject("Could not create a browser instance => : ", err)
            }
        });
    }

    async pageScraper(browser, asin) {
        return new Promise(async (resolve, reject) => {
            
                const url = 'http://amazon.com.mx/dp/';
                let newPage = await browser.newPage();
                await newPage.setDefaultNavigationTimeout(60000);
                await newPage.goto(url + asin)
                //.then(async(res)=>{console.log("Respuesta: ", url , asin);});
                await newPage.waitForTimeout(3000)
                    //.then(() => console.log(colors.bold.green('Waited a second! The page are loading...\n¡Espera un segundo! La página se está cargando ...')));
                let lastPosition = await scrollPageToBottom(newPage, 500, 50);
                //console.log(`Finish Scroll at: ${lastPosition}`);
                await newPage.click(`a[title="Ver opciones de compra"]`)
                    .catch(async () => {
                        //console.log('Fallo click en a[title="Ver opciones de compra"]');
                        await newPage.click(`#olp_feature_div > div.a-section.a-spacing-small.a-spacing-top-small > span > a`)
                            .catch(async () => {
                                //console.log("Fallo click en #olp_feature_div");
                                await newPage.click("#landingImage")
                                    .catch(async () => {
                                        //console.log("Fallo click en #landingImage");
                                        newPage.close();
                                        reject("No existe la pagina del producto")
                                    });
                            });
                    });

                //*Get description
                let description = await newPage.$('#productDescription') == null? "No se encontro descripción del producto." : await newPage.$eval('#productDescription', (e) => e.innerText);

                //*Get short description
                let shortDescription = await newPage.$eval('#feature-bullets', (e) => e.innerText)
                    .catch(async (error) => {
                        return "No se encontro descripción corta del producto."
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
                let longDescription = await newPage.$eval('#aplus > div', (e)=>{
                    let elementOuter = "";
                    //let elementText = [];
                    //elementText.push(e.innerText);
                    elementOuter += e.innerText
                    //let img = e.getElementsByTagName('img');
                    let p = e.getElementsByTagName('p');
                    let h4 = e.getElementsByTagName('h4');
                    /*if (0!=img.length) {
                        for (let i = 0; i < img.length; i++) {
                            //elementImg += img[i].outerHTML;
                            elementOuter+= img[i].outerHTML;
                        }
                    }*/
                    //NOTE Revisar la función de imagenes para mejorar la descripción larga
                
                    for (let i = 0; i < p.length; i++) {
                        if(i < h4.length){
                            elementOuter+= "<h4>"+h4[i].innerText+"</h4>";
                        }
                        elementOuter+= "<p>"+p[i].innerText+"</p>";
                    }
                    
                    console.log("elementOuter: ", elementOuter);
                    return elementOuter;
                    //return e.innerHTML
                })
                .catch(async (error) => {
                    return "No se encontro descripción larga del producto."
                });
                //let longDescription = list.replace(/(\r\n|\n|\r)/gm, "");//TODO Eliminar replace, modificar el newPAge.$eval de arriba para darle estructura  a la longDescription

                let res = [];
                res['description'] = description;
                res['shortDescription'] = shortDescription;
                res['formattedImg'] = formattedImg;
                res['longDescription'] = longDescription;

                await newPage.close();
                //await browser.close().then(async () => console.log("The page was close!")).catch(async () => console.log("The page was close!"));
                this.item = res;
                resolve(this.item)
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