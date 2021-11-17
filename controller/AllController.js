const WoocommerceApiModel = require('../woocommerce/WoocommerceApiModel');
const MercadoLibreAPIModel = require('../mercadolibre/MercadoLibreAPIModel');
const AmazonAPIModel = require("../amazon/amazonAPIModel");
const AmazonScraperModel = require('../amazon/AmazonScraperModel');
const MarketsyncModel = require('../marketsync/MarketsyncModel');
const MarketsyncScraperModel = require('../marketsync/MarketSyncScraperModel');
const dataProduct = require('../dataProduct');
const fs = require('fs');

class AllController {

    amzMod = new AmazonAPIModel();
    amzScrap = new AmazonScraperModel();
    mlMod = new MercadoLibreAPIModel();
    wooMod = new WoocommerceApiModel('https://distribuidorariveragonzalez.com/');
    mktMod = new MarketsyncModel();
    mktScrap = new MarketsyncScraperModel();
    browser;
    cat_mkt;

    //* Generales
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

    async getDataProduct() {
        return new Promise(async (resolve, reject) => {
            (dataProduct.sku != "") ? resolve(dataProduct): reject(`El objeto dataProduct esta vacio.`)
        });
    }

    //*Sección de Amazon
    async startBrowser(boolean = true) {
        return new Promise(async (resolve, reject) => {
            if (boolean) {
                await this.amzScrap.startPuppeter()
                    .then(async (browser) => {
                        this.browser = browser;
                        resolve(browser);
                    })
                    .catch(async (error) => {
                        reject("Error: ", error);
                    });
            } else {
                await this.amzScrap.startBrowser()
                    .then(async (browser) => {
                        this.browser = browser;
                        resolve(browser);
                    })
                    .catch(async (error) => {
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
                let inventory = [];
                let inventoryTemp = [];
                inventoryTemp.nextToken = null;
                //*Se obtiene los ASIN y el inventario de Amazon
                do {
                    inventoryTemp = await this.amzMod.getInventorySummaries(inventoryTemp.nextToken);
                    for (let i = 0; i < inventoryTemp.length; i++) {
                        inventory.push(inventoryTemp[i]);
                    }
                } while (null != inventoryTemp.nextToken);
                let res = {
                    msg: 'Inventario obtenido con éxito.',
                    data: inventory,
                }
                resolve(res)
            } catch (e) {
                reject('Error al obtener el inventario. Error: ', e)
            }
        });
    }

    async getAmazonSellerInventory(browser = this.browser) {
        return new Promise(async (resolve, reject) => {
            try {
                let inventory = [];
                //const browser = await this.amzScrap.startBrowser();
                //*Se obtiene los ASIN y el inventario de Amazon
                inventory = await this.amzScrap.scrapeSellerInventory(browser);

                let res = {
                    msg: 'Inventario obtenido con éxito',
                    data: inventory,
                }
                await browser.close();
                resolve(res)
            } catch (e) {
                reject('Error al obtener el inventario. Error: ', e)
            }
        });
    }

    async copyAmazonToWoocommerce(element, browser) {
        return new Promise(async (resolve, reject) => {

            let condition = await this.wooMod.existsProduct(element.asin);
            //let condition = true;
            if (condition) {
                await this.amzMod.getAsinData(element.asin)
                    .catch(async (res) => {
                        reject(`No se pudo crear el producto con SKU ${element.asin}. ${res}`)
                    });
                await this.amzScrap.pageScraper(browser, element.asin).catch(async (res) => {
                    reject(res);
                });
                dataProduct.sku = element.asin;
                dataProduct.name = await this.amzMod.getItemName();
                dataProduct.regular_price = await this.amzMod.getPricing(element.asin);
                dataProduct.stock_quantity = element.totalQuantity;
                dataProduct.dimensions.height = await this.amzMod.getHeight().catch(async () => {
                    return '15'
                });
                dataProduct.dimensions.length = await this.amzMod.getLength().catch(async () => {
                    return '15'
                });
                dataProduct.dimensions.width = await this.amzMod.getWidth().catch(async () => {
                    return '15'
                });
                dataProduct.weight = await this.amzMod.getWeight().catch(async () => {
                    return '15'
                });
                dataProduct.meta_data[0].value = await this.amzMod.getEAN().catch(async () => {
                    return ''
                });
                dataProduct.meta_data[1].value = await this.amzMod.getBrandName().catch(async () => {
                    return ''
                });
                dataProduct.meta_data[2].value = await this.amzMod.getManufacturer().catch(async () => {
                    return ''
                });
                dataProduct.meta_data[3].value = await this.amzMod.getModelNumber().catch(async () => {
                    return ''
                });
                dataProduct.meta_data[4].value = await this.amzMod.getCategory(element.asin);
                dataProduct.meta_data[5].value = await this.amzMod.getCompetitivePricing(element.asin);
                dataProduct.meta_data[6].value = await this.mlMod.getProductCategory(dataProduct.name);
                dataProduct.meta_data[7].value = await this.mlMod.getProductCategoryName(dataProduct.name);
                //dataProduct.meta_data[8].value = await this.mktMod.getCategorieID(dataProduct.meta_data[7].value, this.cat_mkt);
                dataProduct.description = await this.amzScrap.getDescription();
                dataProduct.description += await this.amzScrap.getLongDescription();
                dataProduct.short_description = await this.amzScrap.getShortDescription();
                dataProduct.images = await this.amzScrap.getImages();

                await this.wooMod.createProduct(dataProduct);

                resolve(`Producto ${dataProduct.name} creado con éxito.`)
            } else {
                reject(`No se pudo crear el producto con SKU ${element.asin}. El proucto ya existe.`)
            }
        });
    }

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
    // async getWoocommerceAvailableSku() {
    //     return new Promise(async (resolve, reject) => {
    //         let i = 1;
    //         let ret = [];
    //         let condition;
    //         do {
    //             await this.wooMod.getInventorySummaries(i)
    //                 .then(async (res) => {
    //                     condition = res.length;
    //                     for (let j = 0; j < res.length; j++) {
    //                         if (res[j].stock_status == "instock") ret.push(res[j].sku);
    //                     }
    //                     i++;
    //                 })
    //                 .catch(async (error) => {
    //                     reject(error)
    //                 })
    //         } while (condition != 0);

    //         resolve(ret);
    //     });
    // }

    async copyWoocommerceToMarketsync(sku) {
        return new Promise(async (resolve, reject) => {

            if (!await this.wooMod.existsProduct(sku)) {
                await this.wooMod.getProduct(sku)
                    .then(async (res) => {
                        let code = await this.mktMod.getMarketsycCategoryCode(res);
                        console.log('Code: ', code, 'Condición: ', code.includes('Producto'));
                        if(true){
                            let id = await this.mktMod.createProducts(res).then(async res => {
                                console.log(res.data)
                                return res.data.answer[0].id
                            });
                            
                            console.log("ID: ", id);
                            await this.mktMod.createVaration(id, res);
                            await this.mktMod.publicarProducto(id);
                            await this.mktMod.setPrice(id, res);
                            resolve(`Articulo con SKU ${sku}, copiado con éxito.!`);    
                        }
                    })
                    .catch(async (error) => {
                        reject(error)
                    });
            } else {
                reject(`No se pudo copiar el producto con SKU ${sku}. El proucto no existe.`)
            }
        });
    }

    //WARING Revisar esta función para mejorarla.
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
            if(!await this.mlMod.existsProduct(element.asin)){
                await this.wooMod.getProduct(element.asin)
                .then(async(res)=>{
                    let cat;
                    for (let i = 0; i < res.meta_data.length; i++) {
                        if(res.meta_data[i].key == '_mercadolibre_category_code'){
                            cat = res.meta_data[i].value;
                        }
                    }
                    await this.mlMod.createProduct(res, cat)
                    .then(async(res)=>{
                        await this.mlMod.createDescription(res.id)
                        .then(async(res)=>{
                            resolve(`Producto creado exitosamente. SKU: ${element.asin}`)
                        })
                        .catch(async(error)=>{
                            reject(`Error en copyWoocommerceToMercadoLibre en catch de mlMod.createDescription(): ${error}`)
                        })
                    })
                    .catch(async(error)=>{
                        reject(`Error en copyWoocommerceToMercadoLibre en catch de mlMod.createProduct(): ${error}`)
                    })
                })
                .catch(async(error)=>{
                    reject(`Error en copyWoocommerceToMercadoLibre en catch de wooMod.getProduct(): ${error}`)
                })
            }else{ 
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
                let cat = await this.mktScrap.buclePaginacategorias(page,products_woo[pw]);
                    let update_woo;
                    for (let k = 0; k < cat.meta_data.length; k++) {
                        if(cat.meta_data[k].key == '_marketsync_category_code'){
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
                .then(async(res)=>{
                    console.log("Respuesta: ", res.data.sku);
                })
                .catch(async(error)=>{
                    console.log("Error: ", error);
                });
            }

            resolve('Productos actualizados.')
        });
    }

    async updateWoocommerceStock(boolean = true){
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

            let inventory = await this.amzScrap.scrapeSellerInventory(this.browser);

            for (let gris = 0; gris < inventory.length; gris++) {
                
                if(!await this.wooMod.existsProduct(inventory[gris].asin)){
                    await this.wooMod.getProduct(inventory[gris].asin)
                    .then(async(res)=>{
                        await this.wooMod.updateProduct(res.id,{stock_quantity: inventory[gris].totalQuantity})
                        .then(async(res)=>{
                            console.log("Respuesta: ", res);
                        })
                        .catch(async(error)=>{
                            console.log("Error: ", error);
                            reject(error)
                        })
                        
                    })
                    .catch(async(error)=>{
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
                    if(dataProduct[i].meta_data[k].key == '_marketsync_category_code'){
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

    async getDataProductML(key_word = "", product_identifier) {
        return new Promise(async (resolve, reject) => {
            await this.mlMod.searchProducts_mkt(key_word, product_identifier)
                .then(async (res) => {
                    resolve(res);
                })
                .catch(async (error) => {
                    reject(error);
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

}

module.exports = AllController;