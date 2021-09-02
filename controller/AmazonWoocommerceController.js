const AmazonAPIModel = require("../amazon/amazonAPIModel");
const AmazonScraperModel = require('../amazon/AmazonScraperModel');
const WoocommerceApiModel = require('../woocommerce/WoocommerceApiModel');
const dataProduct = require('../dataProduct');

class AmazonWoocommerceController {

    amzAPI;
    amzScrap;
    browser;
    wooAPI;

    async createConections() {
        return new Promise(async (resolve, reject) => {
            try {
                this.amzAPI = new AmazonAPIModel();
                await this.amzAPI.connect(this.amzAPI.REFRESHTOKEN);
                this.amzScrap = new AmazonScraperModel();
                this.browser = await this.amzScrap.startPuppeter();
                this.wooAPI = new WoocommerceApiModel();
                await this.wooAPI.connect();

                resolve('Conexión creada con éxito!.')
            } catch (e) {
                reject('Error al crear la conexión. Error: ', e)
            }
        });
    }

    async getInventory() {
        return new Promise(async (resolve, reject) => {
            try {
                let inventory = [];
                let inventoryTemp = [];
                inventoryTemp.nextToken = null;
                //*Se obtiene los ASIN y el inventario de Amazon
                do {
                    inventoryTemp = await this.amzAPI.getInventorySummaries(inventoryTemp.nextToken);
                    for (let i = 0; i < inventoryTemp.length; i++) {
                        inventory.push(inventoryTemp[i]);
                    }
                } while (null != inventoryTemp.nextToken);
                let res = {
                    msg: 'Inventario obtenido con éxito',
                    data: inventory,
                }
                resolve(res)
            } catch (e) {
                reject('Error al obtener el inventario. Error: ', e)
            }
        });
    }

    async copyAmazonToWoocommerce(element) {
        return new Promise(async (resolve, reject) => {
            
                let condition = await this.wooAPI.getProduct(element.asin);
                if (!condition) {
                    await this.amzAPI.getAsinData(element.asin);
                    await this.amzScrap.pageScraper(this.browser, element.asin);
                    dataProduct.sku = element.asin;
                    dataProduct.regular_price = await this.amzAPI.getPricing(element.asin);
                    dataProduct.stock_quantity = element.totalQuantity;
                    dataProduct.dimensions.height = await this.amzAPI.getHeight();
                    dataProduct.dimensions.length = await this.amzAPI.getLength();
                    dataProduct.dimensions.width = await this.amzAPI.getWidth();
                    dataProduct.weight = await this.amzAPI.getWeight();
                    dataProduct.meta_data[0].value = await this.amzAPI.getEAN();
                    dataProduct.meta_data[1].value = await this.amzAPI.getBrandName();
                    dataProduct.meta_data[2].value = await this.amzAPI.getManufacturer();
                    dataProduct.meta_data[3].value = await this.amzAPI.getModelNumber();
                    dataProduct.meta_data[4].value = await this.amzAPI.getCategory(element.asin);
                    dataProduct.meta_data[5].value = await this.amzAPI.getCompetitivePricing(element.asin);
                    dataProduct.description = await this.amzScrap.getDescription();
                    dataProduct.name = await this.amzAPI.getItemName();
                    //dataProduct.description += `\n ${await this.amzScrap.getLongDescription()}`;
                    dataProduct.description += await this.amzScrap.getLongDescription();
                    dataProduct.short_description = await this.amzScrap.getShortDescription();
                    dataProduct.images = await this.amzScrap.getImages();

                    await this.wooAPI.createProduct(dataProduct);
                    resolve(`Producto ${dataProduct.name} creado con éxito.`)
                } else {
                    reject(`No se pudo crear el producto con SKU ${element.asin}. El proucto ya existe.`)
                }
        });
    }

}

module.exports = AmazonWoocommerceController;