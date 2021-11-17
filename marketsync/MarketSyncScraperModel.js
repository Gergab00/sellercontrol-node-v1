require('dotenv').config();
const puppeteerCore = require('puppeteer-core');
const puppeteer = require('puppeteer');
const chromeLauncher = require('chrome-launcher');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const request = require('request');
const util = require('util');
const fs = require('fs');
const { resolve } = require('path');

class MarketsyncScraperModel {

    /**
     * @description Inicia el chromeLauncher
     */
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
                //console.log("Could not create a browser instance => : ", err);
                reject("Could not create a browser instance => : ", err)
            }
        });
    }

    /**
     * @description Inicia Chrominuin sin headers
     */
    async startPuppeter() {
        return new Promise(async (resolve, reject) => {
            try {
                const browser = await puppeteer.launch();
                console.log('Browser iniciado con éxito.')
                resolve(browser)
            } catch (err) {
                //console.log("Could not create a browser instance => : ", err);
                reject("Could not create a browser instance => : ", err)
            }
        });
    }


    async pageCategoryScraper(browser, dataProduct) {
        return new Promise(async (resolve) => {
            const url = 'https://web.marketsync.mx/usuarios/login';
            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(0);
            await page.goto(url);
            // Set the HTTP Basic Authentication credential
            await page.type('#inputEmail', process.env.MS_USER);
            page.waitForTimeout(1000).then(() => console.log('Waited a second!'));
            await page.type('#inputPassword', process.env.MS_PASS);
            page.waitForTimeout(1000).then(() => console.log('Waited a second!'));
            await page.keyboard.press('Enter', {
                delay: 2000
            });

            for (let i = 0; i < dataProduct.length; i++) {
                console.log(dataProduct[i].meta_data);
                await page.waitForTimeout(5000);
                await page.waitForSelector('#dropdown04').then(async () => {
                    await page.click('#dropdown04');
                    await page.waitForTimeout(1500);
                    await page.click('#navbarsExampleDefault > ul.navbar-nav.mr-auto > li.nav-item.dropdown.show > div > a:nth-child(2)');
                    await page.waitForTimeout(2000);
                    await page.type('#title', dataProduct[i].name);
                    await page.click('#btnBuscar');
                    await page.waitForTimeout(1500);
                    await page.waitForSelector('#resultado > h4 > a');
                    await page.click('#resultado > h4 > a');
                    await page.waitForTimeout(5500);
                    //await page.waitForSelector('body > div > div > div > div > a:nth-child(7)')
                    let cat = await page.$eval('body > div > div > div > div > a:nth-child(7)', async (e) => {
                            let cat = e.href;
                            console.log('Categoria obtenida: ', cat);
                            return cat.slice(-4) ;
                            
                        })
                        .catch(async () => {
                             console.log('Producto sin categoria, reivsar manualmente.');
                             return 'Producto sin categoria, reivsar manualmente.'
                         });
                    //await page.goto('https://web.marketsync.mx/admin/master');
                    for (let abc = 0; abc < dataProduct[i].meta_data.length; abc++) {
                        if(dataProduct[i].meta_data[abc].key == '_marketsync_category_code'){
                           dataProduct[i].meta_data[abc].value = cat
                        }
                    }
                    
                    console.log('Categoria scrapeada: ', cat)

                });
            }
            resolve(dataProduct)
        });
    }

    async ingresarMarketsyn(browser){
        return new Promise(async (resolve) => {
            const url = 'https://web.marketsync.mx/usuarios/login';
            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(0);
            await page.goto(url);
            // Set the HTTP Basic Authentication credential
            await page.type('#inputEmail', process.env.MS_USER);
            page.waitForTimeout(1000).then(() => console.log('Waited a second!'));
            await page.type('#inputPassword', process.env.MS_PASS);
            page.waitForTimeout(1000).then(() => console.log('Waited a second!'));
            await page.keyboard.press('Enter', {
                delay: 2000
            });
            resolve(page)
        });
    }

    async buclePaginacategorias(page, dataProduct){
        return new Promise(async (resolve) => {
            await page.waitForTimeout(5000);
                await page.waitForSelector('#dropdown04').then(async () => {
                    await page.click('#dropdown04');
                    await page.waitForTimeout(1500);
                    await page.click('#navbarsExampleDefault > ul.navbar-nav.mr-auto > li.nav-item.dropdown.show > div > a:nth-child(2)');
                    await page.waitForTimeout(2000);
                    await page.type('#title', dataProduct.name);
                    await page.click('#btnBuscar');
                    await page.waitForTimeout(1500);
                    await page.waitForSelector('#resultado > h4 > a');
                    await page.click('#resultado > h4 > a');
                    await page.waitForTimeout(5500);
                    //await page.waitForSelector('body > div > div > div > div > a:nth-child(7)')
                    let cat = await page.$eval('body > div > div > div > div > a:nth-child(7)', async (e) => {
                            let cat = e.href;
                            console.log('Categoria obtenida: ', cat);
                            return cat.slice(-4) ;
                            
                        })
                        .catch(async () => {
                             console.log('Producto sin categoria, reivsar manualmente.');
                             return 'Producto sin categoria, reivsar manualmente.'
                         });
                    //await page.goto('https://web.marketsync.mx/admin/master');
                    for (let abc = 0; abc < dataProduct.meta_data.length; abc++) {
                        if(dataProduct.meta_data[abc].key == '_marketsync_category_code'){
                           dataProduct.meta_data[abc].value = cat
                        }else if(abc+1 == dataProduct.meta_data.length){
                            dataProduct.meta_data.push({
                                key: '_marketsync_category_code',
                                value: cat
                            });
                        }
                    }
                    
                    console.log('Categoria scrapeada: ', cat)

                });
            resolve(dataProduct)
        });
    }

    //! Otras funciones

    async writeCookies(page, path) {
        return new Promise(async (resolve, reject) => {
            // Get cookies
            let cookies = await page.cookies();
            // Write cookies
            fs.writeFile(
                path,
                JSON.stringify(cookies, null, 2),
                (err) => {
                    if (err) reject(err)
                    else {
                        resolve('File cookies written successfully\n')
                    }
                },
            );
        });
    }

    async readCookies(page, path) {
        return new Promise(async (resolve, reject) => {
            // Use fs.readFile() method to read the file
            fs.readFile(path, 'utf8', function (err, data) {
                if (err) reject(err)
                else {
                    // Display the file content
                    //console.log(data);
                    const cookie = JSON.parse(data);
                    page.setCookie(...cookie);
                    resolve('Session has been loaded in the browser!');
                }
            });
        });
    }

}

module.exports = MarketsyncScraperModel;