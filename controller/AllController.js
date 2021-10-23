const WoocommerceApiModel = require('../woocommerce/WoocommerceApiModel');
const MercadoLibreAPIModel = require('../mercadolibre/MercadoLibreAPIModel.js');
const AmazonAPIModel = require("../amazon/amazonAPIModel");
const AmazonScraperModel = require('../amazon/AmazonScraperModel');
const dataProduct = require('../dataProduct');
const fs = require('fs');

class AllController {

    amzMod = new AmazonAPIModel();
    amzScrap = new AmazonScraperModel();
    mlMod = new MercadoLibreAPIModel();
    wooMod = new WoocommerceApiModel();
    browser;

    //* Generales
    async connect(mlCode) {
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
            resolve(msg);
        });

    }

    async getDataProduct() {
        return new Promise(async (resolve, reject) => {
            (dataProduct.sku != "") ? resolve(dataProduct): reject(`El objeto dataProduct esta vacio.`)
        });
    }

    async startBrowser(boolean = true) {
        return new Promise(async (resolve, reject) => {
            if(boolean){
                await this.amzScrap.startPuppeter()
                .then(async(browser)=>{
                    this.browser = browser;
                    resolve(browser);
                })
                .catch(async(error)=>{
                    reject("Error: ", error);
                });
            }else{
                await this.amzScrap.startBrowser()
                .then(async(browser)=>{
                    this.browser = browser;
                    resolve(browser);
                })
                .catch(async(error)=>{
                    reject("Error: ", error);
                });
            }
        });
    }

    async stopBrowser(browser = this.browser){
        return new Promise(async (resolve, reject) => {
            await browser.close()
            .then(async()=>{
                resolve(`Navegador cerrado con éxito.`)
            })
            .catch(async(error)=>{
                reject(`Error al cerrar el navegador. ${error}`)
            });
        });
    }
    //*Sección de Amazon
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

    async getAmazonSellerInventory() {
        return new Promise(async (resolve, reject) => {
            try {
                let inventory = [];
                const browser = await this.amzScrap.startBrowser();
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
                await this.amzScrap.pageScraper(browser, element.asin);
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
                dataProduct.meta_data[0].value = await this.amzMod.getEAN();
                dataProduct.meta_data[1].value = await this.amzMod.getBrandName();
                dataProduct.meta_data[2].value = await this.amzMod.getManufacturer();
                dataProduct.meta_data[3].value = await this.amzMod.getModelNumber();
                dataProduct.meta_data[4].value = await this.amzMod.getCategory(element.asin);
                dataProduct.meta_data[5].value = await this.amzMod.getCompetitivePricing(element.asin);
                dataProduct.meta_data[6].value = await this.mlMod.getProductCategory(dataProduct.name);
                dataProduct.meta_data[7].value = await this.mlMod.getProductCategoryName(dataProduct.name);
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

    //*Sección de Woocommerce
    async getWoocommerceAvailableSku() {
        return new Promise(async (resolve, reject) => {
            let i = 1;
            let ret = [];
            let condition;
            do {
                await this.wooMod.getInventorySummaries(i)
                    .then(async (res) => {
                        condition = res.length;
                        for (let j = 0; j < res.length; j++) {
                            if (res[j].stock_status == "instock") ret.push(res[j].sku);
                        }
                        i++;
                    })
                    .catch(async (error) => {
                        reject(error)
                    })
            } while (condition != 0);

            resolve(ret);
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
    async copyWoocommerceToMercadoLibre(sku) {
        return new Promise(async (resolve, reject) => {
            if (!await this.mlMod.existsProduct(sku)) {
                await this.wooMod.getProduct(sku)
                    .then(async (res) => {
                        await this.mlMod.getProductCategory(res[0].name);
                        await this.mlMod.createProduct(res[0])
                            .then(async (res) => {
                                await this.mlMod.createDescription(res.id, );
                                resolve(`Producto creado exitosamente ${res.id}`)

                            })
                            .catch(async (error) => {
                                reject(error);
                            })
                    })
                    .catch(async (error) => {
                        reject(error);
                    })
            } else {
                reject(`No se pudo crear el producto con SKU ${sku}. El proucto ya existe.`)
            }
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