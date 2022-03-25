const WoocommerceApiModel = require('../woocommerce/WoocommerceApiModel');
const MercadoLibreAPIModel = require('../mercadolibre/MercadoLibreAPIModel');
const AmazonAPIModel = require("../amazon/amazonAPIModel");
const AmazonScraperModel = require('../amazon/AmazonScraperModel');
const ClaroshopModel = require('../claroshop/ClaroshopModel.js');
const flattie = require('flattie');
const Tools = require('../global/Tools.js')
const fs = require('fs');

class AllController {

    amzMod = new AmazonAPIModel();
    amzScrap = new AmazonScraperModel();
    mlMod = new MercadoLibreAPIModel();
    wooMod = new WoocommerceApiModel('https://distribuidorariveragonzalez.com/');
    claroMod = new ClaroshopModel();
    tools = new Tools();
    inventory;
    browser;
    cat_mkt;
    error_log = "";

    //* Generales
    /**
     * @version 27.11.2021
     * 
     */
    async connectAll(mlCode) {
        return new Promise(async (resolve, reject) => {
            let msg;
            msg = await this.amzMod.connect(this.amzMod.REFRESHTOKEN).catch(async (error) => {
                reject(`${msg}\nError al conectar con Amazon. ${error}`)
            });
            msg += await this.mlMod.connect(mlCode).catch(async (error) => {
                reject(`${msg}\nError al conectar con Mercadolibre. ${error}`)
            });
            msg += await this.wooMod.connect().catch(async (error) => {
                reject(`${msg}\nError al conectar con Woocomerce. ${error}`)
            });
            //this.cat_mkt = await this.mktMod.getCategories();
            resolve(msg);
        });
    }

    /**
     * @version 27.11.2021
     * 
     */
    async createLogFile() {
        return new Promise(async (resolve, reject) => {
            let date = new Date();
            fs.writeFile(
                `./json/${await this.formatoFecha(date)}_error_log.json`,
                this.error_log,
                (err) => {
                    if (err) {
                        console.log(err)
                        reject(err)
                    } else {
                        console.log('\nFile data written successfully\n');
                        //console.log('The written has the following contents:')
                        //console.log(fs.readFileSync('./json/claroshop_cat.json', 'utf8').blue);
                        resolve('\nFile data written successfully\n')
                    }
                },
            );
        });
    }

    /**
     * Función que da formato a la fecha con la composición YYYY-MM-DDTHH:MM:SS
     * 
     * @param {Date} fecha 
     * @returns {String} De la fecha con el formato necesario.
     */
    async formatoFecha(fecha) {
        return new Promise(resolve => {
            const map = {
                dd: ('0' + fecha.getDate()).slice(-2),
                mon: ('0' + (fecha.getUTCMonth() + 1)).slice(-2),
                yyyy: fecha.getFullYear(),
                hh: ('0' + fecha.getHours()).slice(-2),
                min: ('0' + fecha.getMinutes()).slice(-2),
                ss: ('0' + fecha.getSeconds()).slice(-2)
            }

            let formattedDate = `${map.yyyy}_${map.mon}_${map.dd}T${map.hh}_${map.min}_${map.ss}`
            resolve(formattedDate);
        });
    }

    //*Sección de Amazon
    /**
     * @description Función que inicia el Browser, ya sea sin cabecera o con, para esto se manda un valor boolean, por defecto true.
     * @param boolean Por defecto true, para iniciar el Browser sin cabecera, y false para inicarlo con cabeceras en Chormelauncher.
     * @return Browser Retorna una promesa con el valor de Browser para poder utilizar un scrapper con puppeter si la promesa se cumple. O un string conel mensaje de error si algo ocurre.
     * @version 27.11.2021
     * 
     */
    async startBrowser(boolean = true) {
        return new Promise(async (resolve, reject) => {
            if (boolean) {
                await this.amzScrap.startPuppeter()
                    .then(async (browser) => {
                        this.browser = browser;
                        resolve(browser);
                    })
                    .catch(async (error) => {
                        this.error_log += `Error en startBrowser - startPuppeter: ${error}.\n`
                        reject("Error en startBrowser - startPuppeter: ", error);
                    });
            } else {
                await this.amzScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                        resolve(browser);
                    })
                    .catch(async (error) => {
                        this.error_log += 'Error en startBrowser - startBrowser: ' + error + '.\n';
                        reject("Error: ", error);
                    });
            }
        });
    }

    async stopBrowser(browser = this.browser) {
        return new Promise(async (resolve, reject) => {
            await browser.close()
                .then(async () => {
                    resolve(`Navegador cerrado con éxito.`)
                })
                .catch(async (error) => {
                    this.error_log += `Error al cerrar el navegador. Error en stopBrowser: ${error}\n`
                    reject(`Error al cerrar el navegador. ${error}`)
                });
        });
    }
    /**
     * @description Se obtiene el inventario de Amazon por medio de la API
     */
    async getAmazonInventory() {
        return new Promise(async (resolve, reject) => {
            try {

                let inventoryTemp = [];
                inventoryTemp.nextToken = null;
                //*Se obtiene los ASIN y el inventario de Amazon
                do {
                    inventoryTemp = await this.amzMod.getInventorySummaries(inventoryTemp.nextToken);
                    for (let i = 0; i < inventoryTemp.length; i++) {
                        this.inventory.push(inventoryTemp[i]);
                    }
                } while (null != inventoryTemp.nextToken);
                let res = {
                    msg: 'Inventario obtenido con éxito.',
                    data: this.inventory,
                }
                resolve(res)
            } catch (e) {
                this.error_log += `Error al obtener el inventario. Error en getAmazonInventory: ${e}.\n`
                await this.tools.pausa();
                reject('Error al obtener el inventario. Error: ', e)
            }
        });
    }

    /**
     * @description Se obtiene el inventario de la página del seller a partir de un scrapper. Se pasa el Browser para poder iniciarlo.
     * @param Browser
     * @return Promise. Devuelve una promesa donde si se cumple retorna un objeto con el inventario (key: data) y el mensaje de éxito (key: msg). Si no se cumple se retorna un string con el mensaje de error.
     * @deprecated
     */
    async getAmazonSellerInventory(browser = this.browser) {
        return new Promise(async (resolve, reject) => {
            try {

                //const browser = await this.amzScrap.startBrowser();
                //*Se obtiene los ASIN y el inventario de Amazon
                this.inventory = await this.amzScrap.scrapeSellerInventory(browser);

                let res = {
                    msg: 'Inventario obtenido con éxito',
                    data: this.inventory,
                }
                await browser.close();
                resolve(res)
            } catch (e) {
                this.error_log += `Error al obtener el inventario. Error en getAmazonSellerInventory: ${e}.\n`
                await this.tools.pausa();
                reject('Error al obtener el inventario. Error: ', e)
            }
        });
    }

    //NOTE Modificar la función como la demás.
    /**
     * @version 2021.12.10
     */
    async copyAmazonToWoocommerce(boolean = true, inventory = []) {
        return new Promise(async (resolve, reject) => {

            if (boolean) {
                await this.amzScrap.startPuppeter()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            } else {
                await this.amzScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            }
            if (inventory.length == 0) {
                inventory = await this.amzScrap.scrapeSellerInventory(this.browser);
            }

            for (let grey = 0; grey < inventory.length; grey++) {
                if (await this.wooMod.existsProduct(inventory[grey].asin)) {

                    await Promise.all([
                            this.amzMod.getAsinData(inventory[grey].asin),
                            this.amzScrap.pageScraper(this.browser, inventory[grey].asin)
                        ])
                        .then(async (res) => {
                            //console.log('Respuesta de PromiseAll: ', flattie.flattie(res, '.', false));

                            let dataProduct = {

                                sku: inventory[grey].asin, //ASIN
                                name: await this.amzMod.getItemName(),
                                regular_price: inventory[grey].price.toString(), //Amazon Price
                                description: await this.amzScrap.getDescription() + " " + await this.amzScrap.getLongDescription(),
                                short_description: await this.amzScrap.getShortDescription(),
                                manage_stock: true,
                                stock_quantity: inventory[grey].totalQuantity,
                                weight: await this.amzMod.getWeight().catch(async () => {
                                    return '15'
                                }),
                                dimensions: {
                                    length: await this.amzMod.getLength().catch(async () => {
                                        return '15'
                                    }),
                                    width: await this.amzMod.getWidth().catch(async () => {
                                        return '15'
                                    }),
                                    height: await this.amzMod.getHeight().catch(async () => {
                                        return '15'
                                    }),
                                },
                                images: await this.amzScrap.getImages().catch(async () => {
                                    return await this.amzMod.getImages()
                                }),
                                meta_data: [{
                                        key: "_ean",
                                        value: await this.amzMod.getEAN().catch(async () => {
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_brand_name",
                                        value: await this.amzMod.getBrandName().catch(async () => {
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_manufacturer",
                                        value: await this.amzMod.getManufacturer().catch(async () => {
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_model_number",
                                        value: await this.amzMod.getModelNumber().catch(async () => {
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_amazon_category",
                                        value: await this.amzMod.getCategory(inventory[grey].asin)
                                    },
                                    {
                                        key: "_competitive_pricing",
                                        value: await this.amzMod.getCompetitivePricing(inventory[grey].asin),
                                    },
                                    {
                                        key: "_mercadolibre_category_code",
                                        value: await this.mlMod.getProductCategory(await this.amzMod.getItemName())
                                    },
                                    {
                                        key: "_mercadolibre_category_name",
                                        value: await this.mlMod.getProductCategoryName(await this.amzMod.getItemName())
                                    },
                                    {
                                        key: "_claroshop_category_code",
                                        value: await this.claroMod.getClaroCategory(await this.mlMod.getProductCategory(await this.amzMod.getItemName()))
                                            .catch(async (error) => {
                                                this.error_log += `Error en getClaroCategory de copyAmazonToWoocommerce: ${error}`
                                                console.log(`Error en getClaroCategory de copyAmazonToWoocommerce: ${error}`);
                                                return ''
                                            }),
                                    },
                                    {
                                        key: "_material",
                                        value: await this.amzMod.getMaterial().catch(async (error) => {
                                            this.error_log += `Error en getMaterial de copyAmazonToWoocommerce: ${error.toString()}`
                                            console.log(`Error en getMaterial de copyAmazonToWoocommerce: ${error.toString()}`);
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_color",
                                        value: await this.amzMod.getColor().catch(async (error) => {
                                            this.error_log += `Error en getColor de copyAmazonToWoocommerce: ${error.toString()}`
                                            console.log(`Error en getColor de copyAmazonToWoocommerce: ${error.toString()}`);
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_max_age",
                                        value: await this.amzMod.getMaxAge().catch(async (error) => {
                                            this.error_log += `Error en getMaxAge de copyAmazonToWoocommerce: ${error.toString()}`
                                            console.log(`Error en getMaxAge de copyAmazonToWoocommerce: ${error.toString()}`);
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_min_age",
                                        value: await this.amzMod.getMinAge().catch(async (error) => {
                                            this.error_log += `Error en getMinAge de copyAmazonToWoocommerce: ${error.toString()}`
                                            console.log(`Error en getMinAge de copyAmazonToWoocommerce: ${error.toString()}`);
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_size",
                                        value: await this.amzMod.getSize().catch(async (error) => {
                                            this.error_log += `Error en getSize de copyAmazonToWoocommerce: ${error.toString()}`
                                            console.log(`Error en getSize de copyAmazonToWoocommerce: ${error.toString()}`);
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_volumen",
                                        value: await this.amzScrap.getVolumen().catch(async (error) => {
                                            this.error_log += 'Error en getVolumen de copyAmazonToWoocommerce: ' + error;
                                            console.log('Error en getVolumen de copyAmazonToWoocommerce: ' + error);
                                            return ''
                                        }),
                                    },
                                    {
                                        key: "_in_warehouse",
                                        value: 'off',
                                    },
                                    {
                                        key: "_in_mercadolibre",
                                        value: 'off',
                                    },
                                    {
                                        key: "_in_claroshop",
                                        value: 'off',
                                    },
                                    {
                                        key: "_ship",
                                        value: inventory[grey].ship,
                                    }
                                ]
                            }

                            //console.log('Respuesta de Data: ', flattie.flattie(dataProduct, '.', false));

                            await this.wooMod.createProduct(dataProduct)
                                .then(async (res) => {
                                    console.log(`Producto ${dataProduct.name} creado con éxito. Response: ${JSON.stringify(res.data)}`);
                                })
                                .catch(async (error) => {
                                    this.error_log += "Error en createProduct de copyAmazonToWoocommerce: " + error;
                                    console.log("Error en createProduct de copyAmazonToWoocommerce: ", error);
                                    await this.tools.pausa();
                                });
                        })
                        .catch(async (error) => {
                            this.error_log += "Error de PromiseAll: " + error
                            console.log("Error de PromiseAll: ", error);
                            await this.tools.pausa();
                        });

                } else {
                    this.error_log += `No se pudo crear el producto con SKU ${inventory[grey].asin}. El proucto ya existe.`;
                    console.log(`No se pudo crear el producto con SKU ${inventory[grey].asin}. El proucto ya existe.`);
                }
            }
            resolve('Productos copiados a woocommerce exitosamente.')
        });
    }

    //*Sección de Woocommerce
    async connectWoo() {
        return await this.wooMod.connect()
    }

    async updateWoocommerceWithMercadoLibre(dataProduct) {
        return new Promise(async (resolve, reject) => {
            dataProduct.meta_data[6].value = await this.mlMod.getProductCategory(dataProduct.name);
            dataProduct.meta_data[7].value = await this.mlMod.getProductCategoryName(dataProduct.name);
            await this.wooMod.updateProduct(dataProduct)
                .then(async (res) => {
                    resolve(`El producto con SKU ${res.sku} se ha actualizado con éxito.`)
                })
                .catch(async (error) => {
                    //console.log("Error: ", error);
                    reject(`Error al actualizar el producto. Error: ${error}`)
                })
        });
    }

    //NOTE Modificar esta función para crearla como el AmazonWoocommerceController
    async copyWoocommerceToMercadoLibre(boolean = true, inventory = []) {
        return new Promise(async (resolve, reject) => {

            if (boolean) {
                await this.amzScrap.startPuppeter()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            } else {
                await this.amzScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            }
            if (inventory.length == 0) {
                inventory = await this.amzScrap.scrapeSellerInventory(this.browser);
            }

            for (let grey = 0; grey < inventory.length; grey++) {
                if (!await this.mlMod.existsProduct(inventory[grey].asin)) {
                    console.log('No existe el producto ' + inventory[grey].asin + ',se procede a crearlo.')
                    await this.wooMod.getProduct(inventory[grey].asin)
                        .then(async (res) => {
                            let cat;
                            let warehouse;
            
                            //Doc Se obtiene la categoria de Mercadolibre para enviarla
                            //console.log(flattie.flattie(res, '.', true))
                            cat = await this.tools.getMetadata(res, '_mercadolibre_category_code');
                            warehouse = await this.tools.getMetadata(res, '_in_warehouse').catch(async (error) => {return 'off'});

                            //console.log('wooMod.getProduct: ', res);
                            if (0 == res.stock_quantity) reject('Inventario 0')
                            /* await this.mlMod.getProductCategoryAtt(cat)
                                .the    n(async (res) => {
                                    console.log("Respuesta de getProductCategoryAtt: ", res);
                                })
                                .catch(async (error) => {
                                    console.log("Error de getProductCategoryAtt: ", error);
                                }); */

                            await this.mlMod.createProduct(res, cat)
                                .then(async (res) => {
                                    
                                    await this.mlMod.createDescription(res.id)
                                        .then(async (res) => {
                                            resolve("Producto creado exitosamente. SKU: " + inventory[grey].asin +" Respuesta: " + res.data)
                                        })
                                        .catch(async (error) => {
                                            this.error_log += `Error en copyWoocommerceToMercadoLibre en catch de mlMod.createDescription(): ${error.response.data}`;
                                            console.log('Error en copyWoocommerceToMercadoLibre en catch de mlMod.createDescription(): ', flattie.flattie(error.response.data))
                                            await this.tools.pausa();
                                            reject(`Error en copyWoocommerceToMercadoLibre en catch de mlMod.createDescription(): ${error.response.data}`)
                                        });

                                        let data;
                                        

                            if (inventory[grey].price < 297) {
                                data = {
                                    "price": inventory[grey].price,
                                    "shipping": {
                                        "mode": "not_specified",
                                        "local_pick_up": false,
                                        "free_shipping": false,
                                        "methods": [],
                                        "costs": []
                                    },
                                    "sale_terms": [{
                                        "id": "MANUFACTURING_TIME",
                                        "value_name": "5 días"
                                    }]
                                }

                            } else {
                                data = {
                                    "price": inventory[grey].price + inventory[grey].ship,
                                    "sale_terms": [{
                                        "id": "MANUFACTURING_TIME",
                                        "value_name": "5 días"
                                    }]
                                }
                            }

                            if(warehouse.includes('on')){
                                data['sale_terms'][0] = {
                                    "id": "MANUFACTURING_TIME",
                                    "value_name": "1 días"
                                }
                            }

                            await this.mlMod.updateProduct(res.id, data)
                                .then(async (res) => {
                                    console.log(`Producto con ASIN ${inventory[grey].asin}, con ID de Mercadolibre ${res.data.id} actualizado correctamente.`);
                                })
                                .catch(async (error) => {
                                    this.error_log += "Error en updatestockPriceMercadolibre en getIDProduct, producto " + inventory[i].asin + ": " + error.response.data
                                    console.log("Error en updatestockPriceMercadolibre en getIDProduct, producto " + inventory[i].asin + ": " + error.response.data);
                                    await this.tools.pausa();
                                });
                                })
                                .catch(async (error) => {
                                    this.error_log += `Error en copyWoocommerceToMercadoLibre en catch de mlMod.createProduct(): ${error.response.data}`;
                                    //reject(`Error en copyWoocommerceToMercadoLibre en catch de mlMod.createProduct(): ${error.toString()}`)
                                    console.log('Error en copyWoocommerceToMercadoLibre en catch de mlMod.createProduct(): ', error.response.data);
                                    await this.tools.pausa();
                                    reject(error.response.data)
                                });

                        })
                        .catch(async (error) => {
                            this.error_log += 'Error en copyWoocommerceToMercadoLibre en catch de wooMod.getProduct(): ' + error;
                            console.log('Error en copyWoocommerceToMercadoLibre en catch de wooMod.getProduct(): ' + error);
                            await this.tools.pausa();
                            reject('Error en copyWoocommerceToMercadoLibre en catch de wooMod.getProduct(): ' + error)
                        })
                } else {
                    resolve(`Ya existe el produdcto ${inventory[grey].asin}`)
                }
            }
        });
    }

    /**
     * @version 
     */
    async updateWoocommerceStock(boolean = true, inventory = []) {
        return new Promise(async (resolve, reject) => {
            if (inventory.length == 0) {
                if (boolean) {
                    await this.amzScrap.startPuppeter()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            reject("Error: ", error);
                        });
                } else {
                    await this.amzScrap.startBrowser()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            reject("Error: ", error);
                        });
                }

                inventory = await this.amzScrap.scrapeSellerInventory(this.browser);
            }

            for (let gris = 0; gris < inventory.length; gris++) {

                if (!await this.wooMod.existsProduct(inventory[gris].asin)) {
                    await this.wooMod.getProduct(inventory[gris].asin)
                        .then(async (res) => {
                            let id = res.id;

                            await this.wooMod.updateProduct(id, {
                                    stock_quantity: inventory[gris].totalQuantity,
                                    price: inventory[gris].price,
                                    regular_price: inventory[gris].price,
                                    sale_price: inventory[gris].price
                                })
                                .then(async (res) => {
                                    console.log("Respuesta: ", res);
                                })
                                .catch(async (error) => {
                                    console.log("Error: ", error);
                                    await this.tools.pausa();
                                    reject(error)
                                });

                        })
                        .catch(async (error) => {
                            console.log("Error: ", error);
                            await this.tools.pausa();
                        })
                }

            }

            resolve('Stock de productos actualizados.')
        });
    }

    /**
     * @version 2022.01.26
     */
    //*Note Revisar la parte de la actualización para automatizarla.
    async updateWoocommerce(boolean = true, inventory = []) {
        return new Promise(async (resolve, reject) => {

            if (boolean) {
                await this.amzScrap.startPuppeter()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            } else {
                await this.amzScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            }

            if (inventory.length == 0) {
                inventory = await this.amzScrap.scrapeSellerInventory(this.browser);
            }

            for (let gris = 0; gris < inventory.length; gris++) {

                if (!await this.wooMod.existsProduct(inventory[gris].asin)) {
                    await this.wooMod.getProduct(inventory[gris].asin)
                        .then(async (res) => {
                            let id = res.id;

                            await Promise.all([
                                    this.amzMod.getAsinData(inventory[gris].asin),
                                    this.amzScrap.pageScraper(this.browser, inventory[gris].asin)
                                ])
                                .then(async (res) => {

                                    console.log('Respuesta de PromiseAll: ', flattie.flattie(res, '.', true));
                                    let data = {
                                        stock_quantity: inventory[gris].totalQuantity,
                                        price: inventory[gris].price.toString(),
                                        regular_price: inventory[gris].price.toString(),
                                        sale_price: inventory[gris].price.toString(),
                                        description: await this.amzScrap.getDescription() + " " + await this.amzScrap.getLongDescription(),
                                        short_description: await this.amzScrap.getShortDescription(),
                                        meta_data: [
                                            {
                                                key: "_ean",
                                                value: await this.amzMod.getEAN().catch(async () => {
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_brand_name",
                                                value: await this.amzMod.getBrandName().catch(async () => {
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_manufacturer",
                                                value: await this.amzMod.getManufacturer().catch(async () => {
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_model_number",
                                                value: await this.amzMod.getModelNumber().catch(async () => {
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_amazon_category",
                                                value: await this.amzMod.getCategory(inventory[gris].asin)
                                            },
                                            {
                                                key: "_competitive_pricing",
                                                value: await this.amzMod.getCompetitivePricing(inventory[gris].asin),
                                            },
                                            {
                                                key: "_mercadolibre_category_code",
                                                value: await this.mlMod.getProductCategory(await this.amzMod.getItemName())
                                            },
                                            {
                                                key: "_mercadolibre_category_name",
                                                value: await this.mlMod.getProductCategoryName(await this.amzMod.getItemName())
                                            },
                                            {
                                                key: "_claroshop_category_code",
                                                value: await this.claroMod.getClaroCategory(await this.mlMod.getProductCategory(await this.amzMod.getItemName()))
                                                    .catch(async (error) => {
                                                        this.error_log += `Error en getClaroCategory de copyAmazonToWoocommerce: ${error}`
                                                        console.log(`Error en getClaroCategory de copyAmazonToWoocommerce: ${error}`);
                                                        return ''
                                                    }),
                                            },
                                            {
                                                key: "_material",
                                                value: await this.amzMod.getMaterial().catch(async (error) => {
                                                    this.error_log += `Error en getMaterial de copyAmazonToWoocommerce: ${error.toString()}`
                                                    console.log(`Error en getMaterial de copyAmazonToWoocommerce: ${error.toString()}`);
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_color",
                                                value: await this.amzMod.getColor().catch(async (error) => {
                                                    this.error_log += `Error en getColor de copyAmazonToWoocommerce: ${error.toString()}`
                                                    console.log(`Error en getColor de copyAmazonToWoocommerce: ${error.toString()}`);
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_max_age",
                                                value: await this.amzMod.getMaxAge().catch(async (error) => {
                                                    this.error_log += `Error en getMaxAge de copyAmazonToWoocommerce: ${error.toString()}`
                                                    console.log(`Error en getMaxAge de copyAmazonToWoocommerce: ${error.toString()}`);
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_min_age",
                                                value: await this.amzMod.getMinAge().catch(async (error) => {
                                                    this.error_log += `Error en getMinAge de copyAmazonToWoocommerce: ${error.toString()}`
                                                    console.log(`Error en getMinAge de copyAmazonToWoocommerce: ${error.toString()}`);
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_size",
                                                value: await this.amzMod.getSize().catch(async (error) => {
                                                    this.error_log += `Error en getSize de copyAmazonToWoocommerce: ${error.toString()}`
                                                    console.log(`Error en getSize de copyAmazonToWoocommerce: ${error.toString()}`);
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_volumen",
                                                value: await this.amzMod.getSize().catch(async (error) => {
                                                    this.error_log += `Error en getSize de copyAmazonToWoocommerce: ${error.toString()}`
                                                    console.log(`Error en getSize de copyAmazonToWoocommerce: ${error.toString()}`);
                                                    return ''
                                                }),
                                            },
                                            {
                                                key: "_in_warehouse",
                                                value: 'off',
                                            },
                                        ]
                                    };

                                    console.log('Respuesta de Data: ', flattie.flattie(data, '.', false));

                                    await this.wooMod.updateProduct(id, data)
                                        .then(async (res) => {
                                            console.log("Respuesta de wooMod.updateProduct: ", res.data);
                                        })
                                        .catch(async (error) => {
                                            console.log("Error de wooMod.updateProduct: ", error);
                                            await this.tools.pausa();
                                            reject(error)
                                        });

                                })
                                .catch(async (error) => {
                                    console.log("Error PromiseAll: ", error);
                                    await this.tools.pausa();
                                })
                        })
                        .catch(async (error) => {
                            console.log("Error: ", error);
                            await this.tools.pausa();
                        })
                }

            }

            resolve('Stock de productos actualizados.')
        });
    }

    //*Sección de Mercadolibre
    async mlConnect(mlCode) {
        return await this.mlMod.connect(mlCode);
    }

    /**
     * @version 2021.12.14
     */
    async updateStockPriceMercadolibre(boolean = true, inventory = []) {
        return new Promise(async (resolve, reject) => {
            //let aumento = 1.15
            if (inventory.length == 0) {
                if (boolean) {
                    await this.amzScrap.startPuppeter()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            this.error_log += `Error en updatestockPriceMercadolibre en startPuppeter: ${error.toString()}.\n`
                            reject("Error: ", error);
                        });
                } else {
                    await this.amzScrap.startBrowser()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            this.error_log += `Error en updatestockPriceMercadolibre en startBrowser: ${error.toString()}.\n`
                            reject("Error: ", error);
                        });
                }

                inventory = await this.amzScrap.scrapeSellerInventory(this.browser);
            }
            for (let i = 0; i < inventory.length; i++) {

                let data;
                let warehouse;
                let id;
                let stop = false;

                await this.wooMod.getProduct(inventory[i].asin)
                    .then(async (res) => {
                        //console.log("Respuesta: ", flattie.flattie(res.meta_data, '.', false));
                        console.log(`Warehouse: ${await this.tools.getMetadata(res, '_in_warehouse')}`);
                        warehouse = await this.tools.getMetadata(res, '_in_warehouse').catch(async () => {return 'off'});
                        stop = true;
                    })
                    .catch(async (error) => {
                        console.log("Error en updateStockPriceMercadolibre -> wooMod.getProducto: ", error);
                        await this.tools.pausa();
                    });
                if(stop){
                console.log(`Buscando ASIN ${inventory[i].asin} en Mercadolibre.`)
                await this.mlMod.getIDProduct(inventory[i].asin)
                    .then(async (res) => {
                        id = res;
                        console.log("Id de Mercadolibre: ", id);
                    })
                    .catch(async (error) => {
                        this.error_log += "Error en updatestockPriceMercadolibre en getIDProduct, producto " + inventory[i].asin + ": " + error;
                        console.log("Error en updatestockPriceMercadolibre en getIDProduct, producto " + inventory[i].asin + ": " + error)
                        await this.tools.pausa();
                        
                    });

                if (inventory[i].price < 297) {
                    data = {
                        "price": inventory[i].price,
                        "shipping": {
                            "mode": "not_specified",
                            "local_pick_up": false,
                            "free_shipping": false,
                            "methods": [],
                            "costs": []
                        },
                        "sale_terms": [{
                            "id": "MANUFACTURING_TIME",
                            "value_name": "5 días"
                        }]
                    }
                    //if(inventory[i].title.includes("Molde")) data.price = inventory[i].price - 75;
                } else {
                    data = {
                        "price": inventory[i].price + inventory[i].ship,
                        "sale_terms": [{
                            "id": "MANUFACTURING_TIME",
                            "value_name": "5 días"
                        }]
                    }
                }

                if(warehouse.includes('on')){
                    data['sale_terms'][0] = {
                        "id": "MANUFACTURING_TIME",
                        "value_name": "1 días"
                    }
                }

                await this.mlMod.updateProduct(id, data)
                    .then(async (res) => {
                        console.log(`Producto con ASIN ${inventory[i].asin}, con ID de Mercadolibre ${res.data.id} actualizado correctamente.`);
                    })
                    .catch(async (error) => {
                        this.error_log += `Error en updatestockPriceMercadolibre en getIDProduct, producto ${inventory[i].asin}: ${error.response.data.toString()}.\n`
                        console.log("Error: ", error.response.data);
                        await this.tools.pausa();
                    });
                }
            }
            resolve('Productos en Mercadolibre actualizados con éxito.')
        });
    }

    async getMercadolibreCategories() {
        return new Promise(async (resolve, reject) => {
            await this.mlMod.getCategorias()
                .then(async (res) => {
                    console.log("Respuesta de getMercadolibreCategories: ", res);
                    resolve(res);
                })
                .catch(async (error) => {
                    console.log("Error de getMercadolibreCategories: ", error);
                    reject(error);
                })
        });
    }

    //*Sección Claroshop
    async copyWoocommerceToClaroshop(boolean = true, inventory = []) {
        return new Promise(async (resolve, reject) => {
            if (inventory.length === 0) {
                if (boolean) {
                    await this.amzScrap.startPuppeter()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            reject("Error: ", error);
                        });
                } else {
                    await this.amzScrap.startBrowser()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            reject("Error: ", error);
                        });
                }

                await this.amzScrap.scrapeSellerInventory(this.browser)
                    .then(async (res) => {
                        inventory = res;
                    });
            }
            //console.log('Tamaño inventario: ', inventory.length)
            for (let cwc = 0; cwc < inventory.length; cwc++) {

                if (!await this.wooMod.existsProduct(inventory[cwc].asin)) {
                    await this.wooMod.getProduct(inventory[cwc].asin)
                        .then(async (res) => {
                            //console.log('Respuesta wooMod.getProduct', res)
                            await this.claroMod.createProducto(await this.claroMod.getSignature(), res)
                                .then(async (res) => {

                                    console.log("Respuesta de createProducto en copyWoocommerceToClaroshop: ", res.mensaje);

                                })
                                .catch(async (error) => {

                                    this.error_log += `Error en catch getProduct de copyWoocommerceToClaroShop: ${error}`;
                                    console.log("Error de createProducto en copyWoocommerceToClaroshop: ", error);

                                })
                        })
                        .catch(async (error) => {

                            this.error_log += `Error en catch getProduct de copyWoocommerceToClaroShop: ${error}`;
                            console.log("Error en catch getProduct de copyWoocommerceToClaroShop: ", error);

                        });

                } else {
                    this.error_log += `No se pudo crear el producto con SKU ${inventory[cwc].asin}. El proucto ya existe.`;
                    console.log(`No se pudo crear el producto con SKU ${inventory[cwc].asin}. El proucto ya existe.`);
                }
            }
            resolve('Articulos copiados con éxito.')
        });
    }

    async updateClaroPriceInventory(boolean = true, inventory = []) {
        return new Promise(async (resolve, reject) => {
            if (inventory.length === 0) {
                if (boolean) {
                    await this.amzScrap.startPuppeter()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            reject("Error: ", error);
                        });
                } else {
                    await this.amzScrap.startBrowser()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            reject("Error: ", error);
                        });
                }

                await this.amzScrap.scrapeSellerInventory(this.browser)
                    .then(async (res) => {
                        inventory = res;
                    });
            }

            //!---

            await this.claroMod.getProductos(await this.claroMod.getSignature(), '')
                .then(async (res) => {
                    for (let epc = 0; epc < res.totalpaginas; epc++) {
                        await this.claroMod.getProductos(await this.claroMod.getSignature(), `?page=${epc+1}`)
                            .then(async (res) => {
                                console.log("Respuesta: ", res);
                                for (let gp = 0; gp < res.productos.length; gp++) {

                                    console.log("Respuesta individual: ", res.productos[gp]);

                                }
                            })
                            .catch(async (error) => {
                                reject(error)
                            });
                    }
                    resolve('Productos eliminados.')
                })
                .catch(async (error) => {
                    reject(error)
                })

            //!-----
            console.log('Tamaño inventario: ', inventory.length)
            for (let cwc = 0; cwc < inventory.length; cwc++) {

                if (!await this.wooMod.existsProduct(inventory[cwc].asin)) {
                    await this.wooMod.getProduct(inventory[cwc].asin)
                        .then(async (res) => {
                            console.log('Respuesta getEAN', await this.claroMod.getEAN(res))
                            let data = {
                                preciopublicobase: inventory[cwc].price * 1.72,
                                preciopublicooferta: inventory[cwc].price,
                                cantidad: inventory[cwc].totalQuantity,
                            }
                            await this.claroMod.updateProduct(await this.claroMod.getSignature(), await this.claroMod.getEAN(res), data)
                                .then(async (res) => {

                                    console.log("Respuesta de updateProduct en updateClaroPriceInvntory: ", res);
                                })
                                .catch(async (error) => {
                                    console.log("Error de updateProduct en updateClaroPriceInvntory: ", error);
                                })
                        })
                        .catch(async (error) => {
                            this.error_log += `Error en catch getProduct de updateClaroPriceInvntory: ${error}`
                            console.log("Error en catch getProduct de updateClaroPriceInvntory: ", error);
                        });

                } else {
                    this.error_log += `No se pudo crear el producto con SKU ${inventory[cwc].asin}. El proucto ya existe.`;
                    console.log(`No se pudo crear el producto con SKU ${inventory[cwc].asin}. El proucto ya existe.`);
                }
            }
            resolve('Articulos actuaizados con éxito.')
        });
    }

    async updateClaroshopCategoryOnWoocommerce(inventory = []) {
        return new Promise(async (resolve, reject) => {
            for (let uccw = 0; uccw < inventory.length; uccw++) {
                await this.wooMod.getProduct(inventory[uccw].asin)
                    .then(async (res) => {
                        //console.log(res.meta_data);
                        let id_product = res.id;
                        await this.claroMod.getClaroCategory(await this.claroMod.getMercadolibreCategoryCode(res))
                            .then(async (res) => {
                                let data = {
                                    meta_data: [{
                                        key: "_claroshop_category_code",
                                        value: res
                                    }]
                                }
                                await this.wooMod.updateProduct(id_product, data)
                                    .then(async (res) => {
                                        console.log("Respuesta: ", res.data.meta_data);
                                        resolve(res.data.meta_data)
                                    })
                                    .catch(async (error) => {
                                        console.log("Error: ", error);
                                        reject(error)
                                    })

                            })
                            .catch(async (error) => {
                                this.error_log += `${error} Articulo con ASIN: ${inventory[uccw].asin}.\n`;
                                console.log(error, ' Articulo con ASIN: ', inventory[uccw].asin)
                            });

                    })
                    .catch(async (error) => {
                        console.log("Error: ", error);
                    });
            }
        });
    }

    async eliminarTodosLosProductosClaroshop() {
        return new Promise(async (resolve, reject) => {
            await this.claroMod.getProductos(await this.claroMod.getSignature(), '')
                .then(async (res) => {
                    for (let epc = 0; epc < res.totalpaginas; epc++) {

                        await this.claroMod.getProductos(await this.claroMod.getSignature(), `?page=${epc+1}`)
                            .then(async (res) => {
                                console.log("Respuesta: ", res);
                                for (let gp = 0; gp < res.productos.length; gp++) {

                                    await this.claroMod.getProducto(await this.claroMod.getSignature(), res.productos[gp].transactionid)
                                        .then(async (res) => {
                                            console.log("Respuesta de getProducto: ", res);
                                        })
                                        .catch(async (error) => {
                                            console.log("Error: ", error);
                                        })

                                    await this.claroMod.deleteProducto(await this.claroMod.getSignature(), res.productos[gp].transactionid)
                                        .then(async (res) => {
                                            console.log("Respuesta de eliminar producto: ", res);
                                        })
                                        .catch(async (error) => {
                                            console.log("Error: ", error);
                                        })

                                }
                            })
                            .catch(async (error) => {
                                reject(error)
                            });
                    }
                    resolve('Productos eliminados.')
                })
                .catch(async (error) => {
                    reject(error)
                })
        });
    }

    //* Getters
    async getWoocommerceProducto(asin){
        return new Promise(async (resolve, reject) => {
            await this.wooMod.getProduct(asin)
            .then(async(res)=>{
                
                console.log( flattie.flattie(res, '.', false) );

                resolve(flattie.flattie(res, '.', false))
            })
            .catch(async(error)=>{
                console.log("Error: ", error);
            })
        });
    }

    async getAmazonProducto(boolean = true, asin){
        return new Promise(async (resolve, reject) => {

            if (boolean) {
                await this.amzScrap.startPuppeter()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            } else {
                await this.amzScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            }

        await Promise.all([
            this.amzMod.getAsinData(asin),
            this.amzScrap.pageScraper(this.browser, asin)
        ])
        .then(async(res)=>{
            console.log("Respuesta: ", res);
            
            resolve( flattie.flattie(res, '.', true) )
        })
        .catch(async(error)=>{
            console.log("Error: ", error);
            reject(error)
        })
                    
        });
    }

    async getMercadolibreProducto(asin){
        return new Promise(async (resolve, reject) => {
            this.mlMod.getProducto(asin)
            .then(async(res)=>{
                console.log("Respuesta de getMercadolibreProducto: ", flattie.flattie(res.data));
            })
            .catch(async(error)=>{
                console.log("Error de getMercadolibreProducto: ", error);
            })
        });
    }

    async getAmazonAPIModel() {
        return this.amzMod;
    }

    async getAmazonScraperModel() {
        return this.amzScrap;
    }

    async getMercadoLibreAPIModel() {
        return this.mlMod;
    }

    async getWoocommerceApiModel() {
        return this.wooMod;
    }

    async getInventory() {
        return this.inventory
    }

}

module.exports = AllController;