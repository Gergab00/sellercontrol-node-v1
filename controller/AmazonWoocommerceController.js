const AmazonAPIModel = require("../amazon/amazonAPIModel");
const AmazonScraperModel = require('../amazon/AmazonScraperModel');
const WoocommerceApiModel = require('../woocommerce/WoocommerceApiModel');
const dataProduct = require('../dataProduct');

class AmazonWoocommerceController {

    async copyAmazonToWoocommerce(){
        return new Promise(async(resolve, reject) => {
            try{
                const amzAPI = new AmazonAPIModel();
                await amzAPI.connect(amzAPI.REFRESHTOKEN);
                const amzScrap = new AmazonScraperModel();
                const browser = await amzScrap.startPuppeter();
                const wooAPI = new WoocommerceApiModel();
                await wooAPI.connect();
                let inventory = [];
                let inventoryTemp = [];
                inventoryTemp.nextToken = null;
                //*Se obtiene los ASIN y el inventario de Amazon
                do {
                    inventoryTemp = await amzAPI.getInventorySummaries(inventoryTemp.nextToken);
                    for (let i = 0; i < inventoryTemp.length; i++) {
                        inventory.push(inventoryTemp[i]);                        
                    }    
                } while (null != inventoryTemp.nextToken);
                console.log('Debug inventory: ', inventory);
                for (let i = 0; i < inventory.length; i++) {
                    const element = inventory[i];
                    await amzAPI.getAsinData(element.asin);
                    await amzScrap.pageScraper(browser, element.asin);
                    dataProduct.sku = element.asin;
                    dataProduct.regular_price = await amzAPI.getPricing(element.asin);
                    dataProduct.stock_quantity = element.totalQuantity;
                    dataProduct.dimensions.height = await amzAPI.getHeight();
                    dataProduct.dimensions.length = await amzAPI.getLength();
                    dataProduct.dimensions.width = await amzAPI.getWidth();
                    dataProduct.weight = await amzAPI.getWeight();
                    dataProduct.meta_data[0].value = await amzAPI.getEAN();
                    dataProduct.meta_data[1].value = await amzAPI.getBrandName();
                    dataProduct.meta_data[2].value = await amzAPI.getManufacturer();
                    dataProduct.meta_data[3].value = await amzAPI.getModelNumber();
                    dataProduct.meta_data[4].value = await amzAPI.getCategory(element.asin);
                    dataProduct.meta_data[5].value = await amzAPI.getCompetitivePricing(element.asin);
                    dataProduct.description = await amzScrap.getDescription();
                    dataProduct.name = await amzAPI.getItemName();
                    dataProduct.description += `\n ${await amzScrap.getLongDescription()}`;
                    dataProduct.short_description = await amzScrap.getShortDescription();
                    dataProduct.images = await amzScrap.getImages();

                    console.log(dataProduct);
                    await wooAPI.createProduct(dataProduct)
                                    .catch(async(error)=>{
                                        console.log("Error al crear el prodcto. Error: ", error);
                                    });;
                }
                await browser.close();
                resolve()
            }catch(e){
                reject(e)
            }
        });
    }

}

module.exports = AmazonWoocommerceController;