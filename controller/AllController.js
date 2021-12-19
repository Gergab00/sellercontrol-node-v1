const WoocommerceApiModel = require('../woocommerce/WoocommerceApiModel');
const MercadoLibreAPIModel = require('../mercadolibre/MercadoLibreAPIModel');
const AmazonAPIModel = require("../amazon/amazonAPIModel");
const AmazonScraperModel = require('../amazon/AmazonScraperModel');
const MarketsyncModel = require('../marketsync/MarketsyncModel');
const MarketsyncScraperModel = require('../marketsync/MarketSyncScraperModel');
const ClaroshopModel = require('../claroshop/ClaroshopModel.js');
const fs = require('fs');

class AllController {

    amzMod = new AmazonAPIModel();
    amzScrap = new AmazonScraperModel();
    mlMod = new MercadoLibreAPIModel();
    wooMod = new WoocommerceApiModel('https://distribuidorariveragonzalez.com/');
    mktMod = new MarketsyncModel();
    mktScrap = new MarketsyncScraperModel();
    claroMod = new ClaroshopModel();
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
            fs.writeFile(
                './json/error_log.json',
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
                        reject("Error: ", error);
                    });
            } else {
                await this.amzScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                        resolve(browser);
                    })
                    .catch(async (error) => {
                        this.error_log += `Error en startBrowser - startBrowser: ${error}.\n`
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
                            console.log("Respuesta de PromiseAll: ", res);

                            let dataProduct = {

                                sku: inventory[grey].asin, //ASIN
                                name: await this.amzMod.getItemName(),
                                regular_price: await this.amzMod.getPricing(inventory[grey].asin), //Amazon Price
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
                                images: await this.amzScrap.getImages(),
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
                                    }
                                ]
                            }

                            await this.wooMod.createProduct(dataProduct)
                                .then(async (res) => {
                                    console.log(`Producto ${dataProduct.name} creado con éxito.`);
                                })
                                .catch(async (error) => {
                                    this.error_log += `Error en createProduct de copyAmazonToWoocommerce: ${error}`
                                    console.log("Error: ", error);
                                });
                        })
                        .catch(async (error) => {
                            this.error_log += `Error de PromiseAll: ${error}`
                            console.log("Error de PromiseAll: ", error);
                        });

                } else {
                    this.error_log += `No se pudo crear el producto con SKU ${inventory[grey].asin}. El proucto ya existe.`;
                    console.log(`No se pudo crear el producto con SKU ${inventory[grey].asin}. El proucto ya existe.`);
                }
            }
            resolve('Productos copiados a woocommerce exitosamente.')
        });
    }

    //WARING Podría ser eliminada del programa.
    async updateWooMarketWithAmazonData() {
        return new Promise(async (resolve, reject) => {
            let inventory = [];
            let products_mkt = [];
            let products_woo = [];
            let update_woo = [];
            //let update_mkt = [];
            const browser = await this.amzScrap.startBrowser();
            //*Se obtiene los ASIN y el inventario de Amazon
            inventory = await this.amzScrap.scrapeSellerInventory(browser);
            //inventory = [{asin: 'B0797J6HNCC', stock_quantity:4}]
            await this.mktMod.getProducts().then(async (res) => {
                products_mkt = res.data.answer
            });

            let total;
            await this.wooMod.getTotalProducts()
                .then(async (res) => {
                    total = res[2].total / 100;
                    total = total + 1;
                    total = total.toFixed();
                    console.log(total);
                });

            for (let a = 0; a < total; a++) {
                await this.wooMod.getInventorySummaries(a + 1).then(async (res) => {
                    let newArray = products_woo;
                    products_woo = newArray.concat(res);
                    console.log('Products: ', products_woo.length, "Total: ", total, "A: ", a);
                });
            }

            console.log('Productos mkt: ', products_mkt[0], products_mkt[0].variaciones[0].atributos);
            console.log('Productos woo: ', products_woo.length);

            for (let i = 0; i < inventory.length; i++) {
                for (let k = 0; k < products_woo.length; k++) {
                    //Doc Se recorre el array del inventario buscando el ASIN comparandolo con el sku de la base de datos de woocommerce
                    if (products_woo[k].sku == inventory[i].asin) {
                        //console.log(`El producto con ASIN ${inventory[i].asin} si existe en la base de datos.`);
                        //console.log(`Comparación ${products_woo[k].sku} == ${inventory[i].asin}`);
                        //console.log(`Producto con ASIN ${inventory[i].asin} actualizado correctamente en Woocommerce.`)
                        update_woo.push({
                            id: products_woo[k].id,
                            stock_quantity: inventory[i].totalQuantity
                        });

                    } // else {
                    //Note Crear función para al actualizar y no tener el producto en Woocommerce
                    //console.log(`El producto con ASIN ${inventory[i].asin} no existe en Woocommerce.`)
                    //}
                }

                for (let j = 0; j < products_mkt.length; j++) {
                    if (products_mkt[j].sku == inventory[i].asin) {
                        // update_mkt.push({
                        //     'product_id': products_mkt[j].id,
                        //     'seller_sku': products_mkt[j].sku,
                        //     'stock': inventory[i].totalQuantity
                        // });
                        //console.log(`Producto con ASIN ${inventory[i].asin} actualizado correctamente en Marketsync.`);
                        await this.mktMod.updateStockProducts([{
                                'product_id': products_mkt[j].id,
                                'seller_sku': products_mkt[j].sku,
                                'stock': inventory[i].totalQuantity
                            }])
                            .then(async (res) => {
                                console.log("Producto con ASIN ", res.data.answer[0].sku, "actualizado con exito.");
                            })
                            .catch(async (error) => {
                                console.log("Error en producto: ", products_mkt[j].sku, " ", error.data);
                            });
                    }
                }
            }
            await this.mktMod.updateStockCut();
            let count = 0;
            for (let b = 0; b < total; b++) { //Doc Variable total se refiere 
                let data_woo = {
                    update: update_woo.slice(count, b + 100)
                };
                await this.wooMod.batchProducts(data_woo);
                count = count + 100;
            }
            // count = 0;
            // for (let b = 0; b < total; b++) {
            //     let data_mkt = update_mkt.slice(count,b);
            //     await this.mktMod.updateStockProducts(data_mkt);
            //     count = count+100;                
            // }
            await this.amzScrap.stopBrowser();
            resolve(`Productos actualizados.`)

        });
    }

    //*Sección de Woocommerce
    async connectWoo() {
        return await this.wooMod.connect()
    }

    //WARING Es posible que se elimine de la app.
    async copyWoocommerceToMarketsync(sku) {
        return new Promise(async (resolve, reject) => {

            if (!await this.wooMod.existsProduct(sku)) {
                await this.wooMod.getProduct(sku)
                    .then(async (res) => {
                        await this.mktMod.getMarketsycCategoryCode(res);

                        let id = await this.mktMod.createProducts(res).then(async res => {
                            console.log(res.data)
                            return res.data.answer[0].id
                        });

                        //console.log("ID: ", id);
                        await this.mktMod.createVaration(id, res);
                        await this.mktMod.publicarProducto(id);
                        await this.mktMod.setPrice(id, res);
                        resolve(`Articulo con SKU ${sku}, copiado con éxito.!`);
                    })
                    .catch(async (error) => {
                        reject(error)
                    });
            } else {
                reject(`No se pudo copiar el producto con SKU ${sku}. El proucto no existe.`)
            }
        });
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
    async copyWoocommerceToMercadoLibre(element) {
        return new Promise(async (resolve, reject) => {
            if (!await this.mlMod.existsProduct(element.asin)) {
                await this.wooMod.getProduct(element.asin)
                    .then(async (res) => {
                        let cat;
                        //Doc Se obteiene la categoria de Mercadolibre para enviarla
                        for (let i = 0; i < res.meta_data.length; i++) {
                            if (res.meta_data[i].key == '_mercadolibre_category_code') {
                                cat = res.meta_data[i].value;
                            }
                        }
                        await this.mlMod.createProduct(res, cat)
                            .then(async (res) => {
                                await this.mlMod.createDescription(res.id)
                                    .then(async (res) => {
                                        resolve(`Producto creado exitosamente. SKU: ${element.asin}`)
                                    })
                                    .catch(async (error) => {
                                        this.error_log += `Error en copyWoocommerceToMercadoLibre en catch de mlMod.createDescription(): ${error}`;
                                        reject(`Error en copyWoocommerceToMercadoLibre en catch de mlMod.createDescription(): ${error}`)
                                    })
                            })
                            .catch(async (error) => {
                                reject(`Error en copyWoocommerceToMercadoLibre en catch de mlMod.createProduct(): ${error}`)
                            })
                    })
                    .catch(async (error) => {
                        reject(`Error en copyWoocommerceToMercadoLibre en catch de wooMod.getProduct(): ${error}`)
                    })
            } else {
                resolve(`Ya existe el produdcto ${element.asin}`)
            }
        });
    }

    async updateCategoriesOnWoocommerce(boolean = true) {
        return new Promise(async (resolve, reject) => {
            let products_woo = [];
            if (boolean) {
                await this.mktScrap.startPuppeter()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            } else {
                await this.mktScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            }

            let total;
            await this.wooMod.getTotalProducts()
                .then(async (res) => {
                    total = res[2].total / 100;
                    total = total + 1;
                    total = total.toFixed();
                    console.log(total);
                });

            for (let a = 0; a < total; a++) {
                await this.wooMod.getInventorySummaries(a + 1).then(async (res) => {
                    let newArray = products_woo;
                    products_woo = newArray.concat(res);
                });
            }

            let page = await this.mktScrap.ingresarMarketsyn(this.browser);

            for (let pw = 0; pw < products_woo.length; pw++) {
                let cat = await this.mktScrap.buclePaginacategorias(page, products_woo[pw]);
                let update_woo;
                for (let k = 0; k < cat.meta_data.length; k++) {
                    if (cat.meta_data[k].key == '_marketsync_category_code') {
                        update_woo = {
                            meta_data: [{
                                key: '_marketsync_category_code',
                                value: cat.meta_data[k].value
                            }]
                        };
                    }
                }
                console.log('Producto ID: ', products_woo[pw].id, ' Update_woo: ', cat);
                await this.wooMod.updateProduct(products_woo[pw].id, update_woo)
                    .then(async (res) => {
                        console.log("Respuesta: ", res.data.sku);
                    })
                    .catch(async (error) => {
                        console.log("Error: ", error);
                    });
            }

            resolve('Productos actualizados.')
        });
    }

    async updateWoocommerceImages(boolean = true, inventory = []) {
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
                if (!await this.wooMod.existsProduct(inventory[grey].asin)) {
                    await Promise.all([
                            this.amzScrap.pageScraper(this.browser, inventory[grey].asin)
                        ])
                        .then(async (res) => {
                            console.log("Respuesta de PromiseAll: ", res);
                            let product_id;
                            await this.wooMod.getProduct(inventory[grey].asin).then((res) => {
                                console.log('Respuesta getProduct: ', res);
                                product_id = res.id
                            });
                            await this.wooMod.updateProduct(product_id, {
                                    images: await this.amzScrap.getImages()
                                })
                                .then(async (res) => {
                                    console.log("Respuesta: ", res);
                                })
                                .catch(async (error) => {
                                    console.log("Error: ", error);
                                    reject(error)
                                })

                        });
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
                            await this.wooMod.updateProduct(res.id, {
                                    stock_quantity: inventory[gris].totalQuantity,
                                    price: inventory[gris].price,
                                    regular_price: inventory[gris].price,
                                    sale_price: inventory[gris].price,
                                })
                                .then(async (res) => {
                                    console.log("Respuesta: ", res);
                                })
                                .catch(async (error) => {
                                    console.log("Error: ", error);
                                    reject(error)
                                })

                        })
                        .catch(async (error) => {
                            console.log("Error: ", error);
                        })
                }

            }

            resolve('Stock de productos actualizados.')
        });
    }

    //* Sección de Marketsync
    async deleteAllofMarketsync() {
        return new Promise(async (resolve, reject) => {
            await this.mktMod.getProducts()
                .then(async (res) => {
                    let inventory = res.data.answer;
                    for (let i = 0; i < inventory.length; i++) {
                        const element = inventory[i].id;

                        await this.mktMod.deleteProducts(element)
                            .then(async (res) => {
                                console.log('Producto borrado con éxito.', res)
                            })
                            .catch(async (error) => {
                                console.log(error.response.data)
                            });
                    }
                    resolve('Varios elementos borrados.')
                })
                .catch(async (error) => {
                    reject(error)
                });
        });
    }

    async updateWarratyOnMarktsync() {
        return new Promise(async (resolve, reject) => {
            await this.mktMod.getProducts_mkt()
                .then(async (res) => {
                    let good = 0;
                    let bad = 0;
                    let inventory = res.data.answer;
                    console.log('Productos obtenidos exitosamente.')
                    for (let i = 0; i < inventory.length; i++) {

                        let p = {
                            product_id: inventory[i].id,
                            warranty: "Garantí­a del vendedor: 30 dí­as"
                        }
                        await this.mktMod.updateProducts_mkt(p)
                            .then(async () => {
                                console.log('Producto ', inventory[i].sku, 'Actualizado exitosamente.');
                                good++;
                            })
                            .catch(async (error) => {
                                console.log('Error al actualizar el producto, ', inventory[i].sku, ". Error: ", error);
                                bad++;
                            });
                    }
                    resolve(`Fin de proceso. Articulos actualizados: ${good}. Articulos no actualizados: ${bad}`)
                })
                .catch(async (error) => {
                    reject(error)
                });
        });
    }

    async updateMarketsyncCategoriesOnWoocommerce() {
        return new Promise(async (resolve) => {
            let dataProduct = await this.scrapeCategoriesOnMarketsync(false);
            let update_woo = []
            for (let i = 0; i < dataProduct.length; i++) {
                for (let k = 0; k < dataProduct[i].meta_data.length; i++) {
                    if (dataProduct[i].meta_data[k].key == '_marketsync_category_code') {
                        update_woo.push({
                            id: dataProduct[i].id,
                            meta_data: [{
                                key: '_marketsync_category_code',
                                value: dataProduct[i].meta_data[k].value
                            }]
                        });
                    }
                }
            }
            let total = dataProduct.length / 100;
            total = total + 1;
            total = total.toFixed();
            let count = 0;
            for (let b = 0; b < total; b++) {
                let data_woo = {
                    update: update_woo.slice(count, b + 100)
                };
                await this.wooMod.batchProducts(data_woo)
                    .then(async () => {
                        console.log(`Productos actualizados correctamente.`);

                    })
                    .catch(async () => {
                        console.log(`Error al actualizar`);

                    });
                count = count + 100;
            }
            resolve()
        });
    }

    async scrapeCategoriesOnMarketsync(boolean = true) {
        return new Promise(async (resolve, reject) => {
            let products_woo = [];
            if (boolean) {
                await this.mktScrap.startPuppeter()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            } else {
                await this.mktScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            }

            let total;
            await this.wooMod.getTotalProducts()
                .then(async (res) => {
                    total = res[2].total / 100;
                    total = total + 1;
                    total = total.toFixed();
                    console.log(total);
                });

            for (let a = 0; a < total; a++) {
                await this.wooMod.getInventorySummaries(a + 1).then(async (res) => {
                    let newArray = products_woo;
                    products_woo = newArray.concat(res);
                });
            }

            let dataProduct = await this.mktScrap.pageCategoryScraper(this.browser, products_woo);
            resolve(dataProduct)
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
            if (inventory.length == 0) {
                if (boolean) {
                    await this.amzScrap.startPuppeter()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            this.error_log += `Error en updatestockPriceMercadolibre en startPuppeter: ${error}.\n`
                            reject("Error: ", error);
                        });
                } else {
                    await this.amzScrap.startBrowser()
                        .then(async (browser) => {
                            this.browser = browser;
                        })
                        .catch(async (error) => {
                            this.error_log += `Error en updatestockPriceMercadolibre en startBrowser: ${error}.\n`
                            reject("Error: ", error);
                        });
                }

                inventory = await this.amzScrap.scrapeSellerInventory(this.browser);
            }
            for (let i = 0; i < inventory.length; i++) {
                let id;
                console.log(`Buscando ASIN ${inventory[i].asin} en Mercadolibre.`)
                await this.mlMod.getIDProduct(inventory[i].asin)
                    .then(async (res) => {
                        id = res;
                        console.log("Id de Mercadolibre: ", id);
                    })
                    .catch(async (error) => {
                        this.error_log += `Error en updatestockPriceMercadolibre en getIDProduct, producto ${inventory[i].asin}: ${error}.\n`
                    });

                let data = {
                    "available_quantity": inventory[i].totalQuantity,
                }

                await this.mlMod.updateProduct(id, data)
                    .then(async (res) => {
                        console.log(`Producto con ASIN ${inventory[i].asin}, con ID de Mercadolibre ${res.data.id} actualizado correctamnte.`);
                    })
                    .catch(async (error) => {
                        this.error_log += `Error en updatestockPriceMercadolibre en getIDProduct, producto ${inventory[i].asin}: ${error.response.data}.\n`
                        console.log("Error: ", error.response.data);
                    });

                let data_2 = {
                    "price": Math.round(Number.parseInt(inventory[i].price) * 1.30)
                }

                await this.mlMod.updateProduct(id, data_2)
                    .then(async (res) => {
                        console.log(`Producto con ASIN ${inventory[i].asin}, con ID de Mercadolibre ${res.data.id} actualizado correctamnte.`);
                    })
                    .catch(async (error) => {
                        this.error_log += `Error en updatestockPriceMercadolibre en getIDProduct, producto ${inventory[i].asin}: ${error.response.data}.\n`
                        console.log("Error: ", error.response.data);
                    });
            }
            resolve('Productos en Mercadolibre actualizados con éxito.')
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
            console.log('Tamaño inventario: ', inventory.length)
            for (let cwc = 0; cwc < inventory.length; cwc++) {

                if (!await this.wooMod.existsProduct(inventory[cwc].asin)) {
                    await this.wooMod.getProduct(inventory[cwc].asin)
                        .then(async (res) => {
                            console.log('Respuesta wooMod.getProduct', res)
                            await this.claroMod.createProducto(await this.claroMod.getSignature(), res)
                                .then(async (res) => {

                                    console.log("Respuesta de createProducto en copyWoocommerceToClaroshop: ", res);
                                })
                                .catch(async (error) => {
                                    console.log("Error de createProducto en copyWoocommerceToClaroshop: ", error);
                                })
                        })
                        .catch(async (error) => {
                            this.error_log += `Error en catch getProduct de copyWoocommerceToClaroShop: ${error}`
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