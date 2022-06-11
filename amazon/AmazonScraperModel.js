require('dotenv').config();
const puppeteerCore = require('puppeteer-core');
const puppeteer = require('puppeteer');
const chromeLauncher = require('chrome-launcher');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const request = require('request');
const util = require('util');
const fs = require('fs');

class AmazonScraperModel {

    item = null;

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

    /**
     * @description Función que resive un Objeto browser, y un String ASIN para extraer la información de la pagina de Amazon
     * 
     * @version 2021.12.09
     * 
     * */
    async pageScraper(browser, asin) {
        return new Promise(async (resolve, reject) => {

            const url = 'http://amazon.com.mx/dp/';
            let newPage = await browser.newPage();
            await newPage.setDefaultNavigationTimeout(60000);
            await newPage.goto(url + asin)
                .then(async () => {
                    console.log("Navegando a: ", url, asin);
                });
            await newPage.waitForTimeout(3000)
                .then(() => console.log('Waited a second! The page are loading...\n¡Espera un segundo! La página se está cargando ...'));
            let lastPosition = await scrollPageToBottom(newPage, 500, 50);

            //*Get images URL #ivLargeImage > img
            let formattedImg = [];
            await newPage.click('#landingImage')
                .then(async () => {

                    let imageTemp = await newPage.$$('.ivThumbImage');

                    console.log(imageTemp.length);

                    for (let it = 0; it < imageTemp.length; it++) {
                        await newPage.click(`#ivImage_${it}`).then(async () => {

                            await newPage.waitForTimeout(3000)
                                .then(() => console.log('Espere un segundo se esta obteniendo la imagen...'));

                            let bigImg = await newPage.$eval("#ivLargeImage > img", (e) => e.src);

                            console.log('Enlace obtenido: ', bigImg);
                            formattedImg.push(bigImg);

                        }).catch(async () => console.log('No hay imagenes en el nodo.'));

                    }

                })
                .catch(async () => {

                    await newPage.click('#imgThumbs > span > a');
                    let bigImg = await newPage.$eval('#igImage', (e) => e.src);
                    console.log('Enlace obtenido: ', bigImg);
                    formattedImg.push(bigImg);
                });


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
            await newPage.waitForTimeout(3000)
                .then(() => console.log('Waited a second! The page are loading...\n¡Espera un segundo! La página se está cargando ...'));

            //*Get description
            let description = await newPage.$('#productDescription').catch(async () => { return null }) == null ? "\n" : await newPage.$eval('#productDescription', (e) => e.innerText).catch(async (e) => { console.log(e); return "\n" });

            //*Get short description
            let shortDescription = await newPage.$eval('#feature-bullets', (e) => e.innerText)
                .catch(async (error) => {
                    console.log(e);
                    return "\n"
                });

            //*Get long description
            let longDescription = await newPage.$eval('#aplus > div', (e) => {
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
                        if (i < h4.length) {
                            elementOuter += "<h4>" + h4[i].innerText + "</h4>";
                        }
                        elementOuter += "<p>" + p[i].innerText + "</p>";
                    }

                    //console.log("elementOuter: ", elementOuter);
                    return elementOuter;
                    //return e.innerHTML
                })
                .catch(async () => {
                    return "\n"
                });
            //let longDescription = list.replace(/(\r\n|\n|\r)/gm, "");//TODO Eliminar replace, modificar el newPAge.$eval de arriba para darle estructura  a la longDescription

            //#productDetails_techSpec_section_1 > tbody > tr:nth-child(6) > td
            //* Get dimension
            let dimension = [];
            for (let grs = 0; grs < 10; grs++) {
                dimension.push(await newPage.$eval(`#productDetails_techSpec_section_1 > tbody > tr:nth-child(${grs+1}) > td`, (e) => {
                    return e.innerHTML
                }).catch(async () => {
                    return '15'
                }));
            }

            //* Get Volumen
            let volumen;
            if (null !== await newPage.$('tr.a-spacing-small.po-volume_capacity_name > td.a-span9 > span')) {
                volumen = await newPage.$eval('tr.a-spacing-small.po-volume_capacity_name > td.a-span9 > span', (e) => e.innerText)
                    .catch(async () => {
                        return ""
                    });
            } else if (null !== await newPage.$('tr.a-spacing-small.po-item_volume > td.a-span9 > span')) {
                volumen = await newPage.$eval('tr.a-spacing-small.po-item_volume > td.a-span9 > span', (e) => e.innerText)
                    .catch(async () => {
                        return ""
                    });
            }

            //*Get Sellers 
            let seller = await newPage.$eval('#tabular-buybox > div.tabular-buybox-container > div:nth-child(4) > div > span', (e) => e.innerText)
                .catch(async (error) => {
                    reject("No disponible para la venta.")
                });

            //Note const variaciones = await this.getVariaciones(newPage)


            let res = [];
            res['description'] = description;
            res['shortDescription'] = shortDescription;
            res['formattedImg'] = formattedImg;
            res['longDescription'] = longDescription;
            //res['dimension'] = dimension;
            res['volumen'] = volumen;
            res['seller'] = seller;

            await newPage.close();
            //await browser.close().then(async () => console.log("The page was close!")).catch(async () => console.log("The page was close!"));
            this.item = res;
            //console.log(res);
            resolve(this.item)
        });
    }

    async getVolumen(item = this.item) {
        return new Promise(async (resolve, reject) => {
            if (typeof item.volumen !== 'undefined') {
                let v = item.volumen;
                let m = item.volumen;
                v = v.match(/(\d+)/g);
                v = Number.parseInt(v[0]);
                if (m.includes('Liters')) {
                    console.log('Litros');
                    resolve(v / 1000)
                } else if (m.includes('Mililitros')) {
                    console.log('Militros');
                    resolve(v)
                } else if (m.includes('Galones')) {
                    console.log('Galones');
                    resolve(v * 3785)
                }
            }
            reject('El objeto esta vacío, o no existe el valor. Error en la función getVolumen.')
        });
    }

    async getSeller(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(item.seller);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getDimension`)
            }
        });
    }

    async getDimension(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(item.dimension);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getDimension`)
            }
        });
    }

    async getDescription(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(item.description)
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getDescription`)
            }
        });
    }

    async getShortDescription(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {

                resolve(item.shortDescription);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getShortDescription`)
            }
        });
    }

    async getLongDescription(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {

                resolve(item.longDescription);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getLongDescription`)
            }
        });
    }

    async getImages(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let img = [];
                if (0 == item.formattedImg.length) reject('Array de imagenes vacia.');
                for (let i = 0; i < item.formattedImg.length; i++) {
                    let a = {
                        "src": item.formattedImg[i],
                    };
                    img.push(a);
                }
                resolve(img);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getImages`)
            }
        });
    }

    /**
     * @author Gerardo Gonzalez
     * @version 2022.04.22
     * @param {Object} browser objeto para poder abrir las páginas
     * @param {String[]} urlArray de strings con las url de busqueda a escrapear
     * @param {number} p Número entero de paginas a avanzar en la busqueda
     */
    async scrapeAmazonProducts(browser, urlArray = [], p = 1) {
        return new Promise(async (resolve, reject) => {
            const url = urlArray;
            const pages = p;
            const page = await browser.newPage(); //Se crea la nueva pesataña
            await page.setDefaultNavigationTimeout(0);
            let data = []; //Se inicializa el array que contendra los datos.

            for (let gi = 0; gi < url.length; gi++) { //Se va iterar en el array de URL
                const u = url[gi];
                await page.goto(u).then(async () => await page.bringToFront());//Se navega la pagina de busqueda
                let condition = true;
                let loop = 0;

                do {
                    await page.waitForTimeout(5000);
                    await scrollPageToBottom(page, 500, 50);
                    let asinArray = await page.$$eval('div[data-component-type="s-search-result"]', tds => {
                        // Extract the asin from the data
                        tds = tds.map(el => el.dataset.asin);
                        return tds;
                    }).catch(async (error) => {
                        reject("Error: ", error);
                    });
                    // span.a-price-whole
                    let priceArray = await page.$$eval('span.a-price-whole', tds => {
                        // Extract the data from the page
                        tds = tds.map(el => el.innerText);
                        return tds;
                    }).catch(async (error) => {
                        reject("Error: ", error);
                    });
                    //div.s-title-instructions-style > h2 > a > span
                    let titleArray = await page.$$eval('div.s-title-instructions-style > h2 > a > span', tds => {
                        // Extract the data from the page
                        tds = tds.map(el => el.innerText);
                        return tds;
                    }).catch(async (error) => {
                        reject("Error: ", error);
                    });

                    let shipArray = await page.$$eval('div.a-section.a-spacing-micro.s-padding-left-small.s-padding-right-small', tds => { //.s-result-list.s-search-results > span.a-color-secondary.s-light-weight-text
                        tds = tds.map(el => {
                           
                            if(`${el.innerText}`.includes('Recíbelo')){
                                return "a"
                            } else {
                                return "b"
                            }
                            //return `${el.innerText}`
                        });
                        console.log("Entrega: ", tds);
                        return tds;
                    });//#search > div.s-desktop-width-max.s-desktop-content.s-opposite-dir.sg-row > div.s-matching-dir.sg-col-16-of-20.sg-col.sg-col-8-of-12.sg-col-12-of-16 > div > span:nth-child(4) > div.s-main-slot.s-result-list.s-search-results.sg-row > div:nth-child(23) > div > div > div > div > 

                    await page.click('a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator').catch(async () => condition = false);

                    if (loop === pages) condition = false;

                    for (let i = 0; i < asinArray.length; i++) {
                        let repetido = true;
                        let a = [];
                        for (let grix = 0; grix < data.length; grix++) {
                            if (asinArray[i] === data[grix].asin) repetido = false;
                            if (typeof priceArray[i] === 'undefined') repetido = false;
                        }
                        if (repetido) {      
                            a = {
                                asin: asinArray[i],
                                price: Number.parseInt(priceArray[i].replace(',', '')),
                                totalQuantity: 2,
                                title: titleArray[i],
                                ship: 125,
                                shipTime: shipArray[i] == 'a' ? true : false
                            };
                            //console.log(`Array información: ${a.asin}, ${a.title}`);
                            console.log(`Array información: ${a.shipTime}`);
                            data.push(a);
                        } else {
                            console.log(`Asin ${asinArray[i]} Repetido.`)
                        }
                    }
                    await page.waitForTimeout(5000);

                    loop++;

                } while (condition);

            }

            resolve(data)
        });
    }

    async scrapeSellerInventory(browser) {
        return new Promise(async (resolve) => {
            const url = 'https://sellercentral.amazon.com.mx/home';
            const page = await browser.newPage();
            page.waitForTimeout(5000);
            await page.setDefaultNavigationTimeout(0);
            let cookiesFilePath = './json/amazon_cookies.json';
            const previousSession = fs.existsSync(cookiesFilePath);
            if (previousSession) {
                // If file exist load the cookies
                await this.readCookies(page, cookiesFilePath);
            }

            await page.goto(url).then(async () => await page.bringToFront());
            //Sentencia que revisa si no hay una sesion activa, si nos manda al login pone el usuario y contraseña
            if (!previousSession) {
                // Set the HTTP Basic Authentication credential
                await page.type('#ap_email', process.env.AMZMAIL);
                page.waitForTimeout(1000).then(() => console.log('Waited a second!'));
                await page.type('#ap_password', process.env.AMZPASS);
                page.waitForTimeout(1000).then(() => console.log('Waited a second!'));
                await page.keyboard.press('Enter', {
                    delay: 2000
                });
            }

            //Sentencia que nos indica si entramos al login o directamente al dashboar
            if (null != await page.$('#ap_password')) { //Si entramos a login pone el password y accesa
                //ap_password
                page.waitForTimeout(5000).then(() => console.log('Waited a second!'));
                await page.type('#ap_password', process.env.AMZPASS);
                page.waitForTimeout(1000).then(() => console.log('Waited a second!'));
                await page.keyboard.press('Enter', {
                    delay: 2000
                });
            }

            //Bucle que revisa que este disponible la pestaña de inventario, si todavia no esta visible lo vuleve a intentar
            await page.waitForTimeout(5000);
            await page.waitForSelector('#sc-navtab-inventory').then(async () => {
                await page.hover('#sc-navtab-inventory').then(() => {
                    page.click('#sc-navtab-inventory > ul > li:nth-child(2) > a');
                });
            });

            // Write cookies
            await this.writeCookies(page, cookiesFilePath);


            // When all the data on this page is done, click the next button and start the scraping of the next page
            // You are going to check if this button exist first, so you know if there really is a next page.
            let nextButtonExist = false;
            let data = [];

            do {
                await page.waitForTimeout(5000);
                await this.obtenerDatos(page, data);

                await page.waitForTimeout(5000);
                nextButtonExist = await this.nextBut(page);
                console.log('Boton: ', nextButtonExist);


                if (nextButtonExist) {
                    await page.click('#myitable-pagination > ul > li.a-last');
                    //return scrapeCurrentPage(); // Call this function recursively
                    a.s - pagination - item.s - pagination - next.s - pagination - button.s - pagination - separator
                } else {

                    fs.writeFile(
                        './json/simple_data.json',
                        JSON.stringify(data, null, 2),
                        (err) => {
                            if (err) console.log(err)
                            else {
                                console.log('File ASIN written successfully');
                                //console.log('The written has the following contents:')
                                //console.log(fs.readFileSync('/json/simple_data.json', 'utf8'))
                            }
                        },
                    );
                    resolve(data)
                }

            } while (nextButtonExist === true);
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

    async obtenerDatos(page, data = []) {
        return new Promise(async (resolve, reject) => {

            let a = [];
            let asinArray = [];
            let priceArray = [];
            let quantityArray = [];
            let titleArray = [];
            let shipArray = [];
            //await page.waitForSelector('#td[data-column="upcOrEan"] span.mt-text-content');
            console.log('Waited a second!\n The page area loading...');
            await page.waitForTimeout(5000)
                .then(async () => {
                    const lastPosition = await scrollPageToBottom(page, 500, 50);
                    console.log(`Finish Scroll at: ${lastPosition}`);
                });

            // Obtenga el asin de todos los productos #TW9sZGVNMjBDb3Jhem9uR2Fqb3M_e-title-asin > div > span
            asinArray = await page.$$eval('div[data-column="asin"] span', tds => {
                // Extract the asin from the data
                tds = tds.map(el => el.innerText);
                return tds;
            }).catch(async (error) => {
                reject("Error: ", error);
            });
            //console.log(`Información array: ${asinArray.length}`);
            priceArray = await page.$$eval('td[data-column="price"] span > input', tds => {
                tds = tds.map(el => el.value);
                return tds
            }).catch(async (error) => {
                reject("Error: ", error);
            });
            quantityArray = await page.$$eval('td[data-column="quantity"]', e => {
                let ret = [];
                for (let i = 0; i < e.length; i++) {
                    const element = e[i];
                    if (element.querySelector('div > span > input') != null) {
                        ret.push(element.querySelector('div > span > input.mt-input-text').value);
                    } else {
                        ret.push(element.querySelector('div > span').innerText);
                    }

                }
                return ret;
            });
            //#TW9sZGVSb3NjYUNvcmF6b25lc00xMzE_e-title-title > div > a
            titleArray = await page.$$eval('td[data-column="title"] div > a', tds => {
                tds = tds.map(el => el.innerText);
                return tds
            }).catch(async (error) => {
                reject("Error: ", error);
            });
            //#QjA3OUs1NEhHRg_e_e-price-shipping > div > span
            shipArray = await page.$$eval('div[data-column="shipping"] span', tds => {
                tds = tds.map(el => el.innerText);
                return tds
            }).catch(async (error) => {
                reject("Error: ", error);
            });

            for (let i = 0; i < asinArray.length; i++) {
                let repetido = true;
                for (let grix = 0; grix < data.length; grix++) {
                    if (asinArray[i] === data[grix].asin) repetido = false;
                }
                if (repetido) {
                    a = {
                        asin: asinArray[i],
                        price: Number.parseInt(priceArray[i].replace(',', '')),
                        totalQuantity: Number.parseInt(quantityArray[i]),
                        title: titleArray[i],
                        ship: Number.parseInt(shipArray[i].replace('+ MXN$', ''))
                    };
                    console.log(`Array información: ${a.asin}, ${a.totalQuantity}, ${a.ship}`);
                    data.push(a);
                } else {
                    console.log(`Asin ${asinArray[i]} Repetido.`)
                }
            }
            resolve(data)
        });
    }

    async nextBut(page) {
        return new Promise(async (resolve) => {
            let ret = await page.$eval('#myitable-pagination > ul > li.a-last', a => {
                //* Revisa si el boton esta activo o inactivo.
                if ('a-disabled a-last' != a.className) {
                    console.log('Class name: ', a.className);
                    return true;
                } else {
                    console.log('Class name: ', a.className);
                    return false;
                }
            });
            resolve(ret);
        });
    }

}

module.exports = AmazonScraperModel;