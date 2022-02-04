require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');
const tools = require('gergab-toolbox');

class AmazonAPIModel {

    sellingPartner = null;
    access_token = null;
    role_credentials = null;
    item = [];
    report_document = [];
    SELLING_PARTNER_APP_CLIENT_ID = null;
    SELLING_PARTNER_APP_CLIENT_SECRET = null;
    AWS_ACCESS_KEY_ID = null;
    AWS_SECRET_ACCESS_KEY = null;
    AWS_SELLING_PARTNER_ROLE = null;
    REFRESHTOKEN = null;

    constructor() {
        this.SELLING_PARTNER_APP_CLIENT_ID = process.env.SELLING_PARTNER_APP_CLIENT_ID;
        this.SELLING_PARTNER_APP_CLIENT_SECRET = process.env.SELLING_PARTNER_APP_CLIENT_SECRET;
        this.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
        this.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
        this.AWS_SELLING_PARTNER_ROLE = process.env.AWS_SELLING_PARTNER_ROLE;
        this.REFRESHTOKEN = process.env.REFRESHTOKEN;
    }

    /**
     * Función que obtiene el AccessToken y el RoleCredentials por medio del refresh_token que se pasa como un string como parametro. El refresh_token, como las demas credenciales se tienen que configurar en el archivo credential.env.
     * Retorna una promesa que si se cumple regresa un objeto de tipo amazon-sp-api; si no se cumple la promesa retorna un String con la descripción del error.
     * @see https://github.com/amz-tools/amazon-sp-api
     * @param {String} refresh_token 
     * @returns {Promise} 
     */
    async connect(refresh_token) {
        return new Promise(async (resolve, reject) => {
            try {
                this.sellingPartner = new SellingPartnerAPI({
                    region: 'na',
                    refresh_token: refresh_token,
                    options: {
                        //credentials_path:'../amazon/amzspapi/credentials.env',
                        auto_request_tokens: true
                    }
                });

                await this.sellingPartner.refreshAccessToken();
                await this.sellingPartner.refreshRoleCredentials();

                this.access_token = this.sellingPartner.access_token;
                this.role_credentials = this.sellingPartner.role_credentials;
                
                //console.log(`Conexión lograda con Amazon con éxito!. Access toke ${this.access_token}. Role Credentials ${this.role_credentials}`);

                resolve(`Conexión lograda con Amazon con éxito!. Access toke ${this.access_token}. Role Credentials ${this.role_credentials}`);
            } catch (e) {
                reject(`Error en connect: ${e.message}`);
            }
        });
    }

    /**
     * @description Se obtenie la información del ASIN por medio de la API, se ingresa un código ASIN y devuelve un array con la información.
     * @param String Código ASIN de Amazon.
     * @see https://sellercentral.amazon.es/forums/t/que-significan-los-codigos-asin-ean-etc/83955/4
     * @return Array con la información del ASIN
     */
    async getAsinData(asin) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    api_path: `/catalog/2020-12-01/items/${asin}`,
                    method: 'GET',
                    query: {
                        marketplaceIds: [process.env.MARKETPLACEID], //Se obtiene el ID del market por medio del credentials.env, que es necesario crear en la carpeta.
                        includedData: ['identifiers', 'images', 'productTypes', 'salesRanks', 'summaries', 'variations']
                    }
                });

                this.item.length = 0;

                this.item.push(res);

                let res_2 = await this.sellingPartner.callAPI({
                    api_path: `/catalog/v0/items/${asin}`,
                    method: 'GET',
                    query: {
                        MarketplaceId: process.env.MARKETPLACEID, //Se obtiene el ID del market por medio del credentials.env, que es necesario crear en la carpeta.
                    }
                });

                this.item.push(res_2);
                resolve(this.item);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getAsinData`)
            }
        });
    }

    async getSize(item = this.item){
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[1].AttributeSets[0].Size

                resolve(res)
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getMaterial`)
            }
        });
    }

    async getMaterial(item = this.item){
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[1].AttributeSets[0].MaterialType[0]

                resolve(res)
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getMaterial`)
            }
        });
    }

    async getColor(item = this.item){
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[1].AttributeSets[0].Color

                resolve(res)
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getColor`)
            }            
        });
    }

    async getMaxAge(item = this.item){
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[1].AttributeSets[0].ManufacturerMaximumAge.value

                resolve(res)
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getMaxAge`)
            }            
        });
    }

    async getMinAge(item = this.item){
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[1].AttributeSets[0].ManufacturerMinimumAge.value

                resolve(res)
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getMinAge`)
            }            
        });
    }

    async getHeight(item = this.item){
        return new Promise(async(resolve, reject) => {
            try{
                let res = item[1].AttributeSets[0].PackageDimensions.Height.value*2.54
                //console.log(`Debug getHeight: res[${res}] item[${item[1]}]`);
                resolve(res.toString())
            }catch(e){
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getHeight`)
            }
        });
    }

    async getLength(item = this.item){
        return new Promise(async(resolve, reject) => {
            try{
                let res = item[1].AttributeSets[0].PackageDimensions.Length.value*2.54
                resolve(res.toString())
            }catch(e){
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getLength`)
            }
        });
    }

    async getWidth(item = this.item){
        return new Promise(async(resolve, reject) => {
            try{
                let res = item[1].AttributeSets[0].PackageDimensions.Width.value*2.54
                resolve(res.toString())
            }catch(e){
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getWidth`)
            }
        });
    }

    async getWeight(item = this.item){
        return new Promise(async(resolve, reject) => {
            try{
                //console.log('Debug: ', item[1].AttributeSets[0].PackageDimensions.Weight.value)
                let res = item[1].AttributeSets[0].PackageDimensions.Weight.value*2.205
                resolve(res.toString())
            }catch(e){
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getWeight`)
            }
        });
    }

    async getEAN(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = "";
                //console.log('Debug: ',item[0].identifiers[0].identifiers, " Length Object: ", item[0].identifiers[0].identifiers.length)
                for (let i = 0; i < item[0].identifiers[0].identifiers.length; i++) {
                    const element = item[0].identifiers[0].identifiers[i].identifierType;
                    //console.log('Debug getEAN: ', element);
                    if (element.includes('EAN')) {
                        res = item[0].identifiers[0].identifiers[i].identifier;
                        //console.log('Debug: ', res);
                    }
                }
                resolve(res)

            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getEAN`)
            }
        });
    }

    async getBrandName(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[0].summaries[0].brandName;
                resolve(res);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getBrandName`)
            }
        });
    }

    async getManufacturer(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[0].summaries[0].manufacturer;
                resolve(res);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getManufacturer`)
            }
        });
    }

    async getItemName(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[0].summaries[0].itemName
                resolve(res);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getItemName`)
            }
        });
    }

    async getModelNumber(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item[0].summaries[0].modelNumber
                resolve(res);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getModelNumber`)
            }
        });
    }

    async getImages(item = this.item) {
        return new Promise(async (resolve) => {
            //item[0][0].images[0].images
            let img = [];
                
                for (let i = 0; i < item[0].images[0].images.length; i++) {
                    let a = {
                        "src": item[0].images[0].images[i].link,
                    };
                    img.push(a);
                }
                resolve(img)
        });
    }

    async getCategory(asin) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    api_path: '/catalog/v0/categories',
                    method: 'GET',
                    query: {
                        MarketplaceId: [process.env.MARKETPLACEID],
                        ASIN: asin,
                    }
                });
                //console.log('Debug getCategory: ', res);
                res == 0 ? resolve('undefined') : resolve(res[0].ProductCategoryName);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getCategory`)
            }
        });
    }

    async getPricing(asin) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    operation: 'getPricing',
                    endpoint: 'productPricing',
                    query: {
                        MarketplaceId: process.env.MARKETPLACEID,
                        Asins: asin,
                        ItemType: 'Asin'
                    }
                });
                let price = 0;
                let condition = await tools.checkNested(res[0], 'Product', 'Offers');
                if (condition) {
                    condition = await tools.checkNested(res[0].Product.Offers[0], 'BuyingPrice', 'LandedPrice', 'Amount');
                    if(condition){
                        price = res[0].Product.Offers[0].BuyingPrice.LandedPrice.Amount;
                    }
                }
                
                resolve(price.toString());
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getPricing`)
            }
        });
    }

    async getCompetitivePricing(asin) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    operation: 'getCompetitivePricing',
                    endpoint: 'productPricing',
                    query: {
                        MarketplaceId: process.env.MARKETPLACEID,
                        Asins: asin,
                        ItemType: 'Asin'
                    }
                });
                let condition = await tools.checkNested(res[0], 'Product', 'CompetitivePricing', 'CompetitivePrices');
                if (condition) {
                    condition = await tools.checkNested(res[0].Product.CompetitivePricing.CompetitivePrices[0], 'Price', 'LandedPrice', 'Amount');
                    if (condition) {
                        resolve(res[0].Product.CompetitivePricing.CompetitivePrices[0].Price.LandedPrice.Amount);   
                    }else{
                        resolve(this.getPricing(asin));
                    }
                }
               
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getCompetitivePricing`)
            }
        });
    }

    async getItemOffers(asin) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    operation: 'getItemOffers',
                    endpoint: 'productPricing',
                    path: {
                        Asin: asin
                    },
                    query: {
                        MarketplaceId: process.env.MARKETPLACEID,
                        ItemCondition: 'New'
                    }
                });
                let offers = [];
                for (let i = 0; i < res.Offers.length; i++) {
                    let element = {
                        Price: res.Offers[i].ListingPrice.Amount + res.Offers[i].Shipping.Amount,
                        IsBuyBoxWinner: res.Offers[i].IsBuyBoxWinner
                    }
                    let j = `offer_${i+1}`;
                    offers[j] = element;
                }
                resolve(offers);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getItemOffers`)
            }
        });
    }

    //TODO Falta ingresar al dataProducts.js y al WooMeta.php
    async getInventorySummaries(nextToken = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    operation: 'getInventorySummaries',
                    endpoint: 'fbaInventory',
                    query: {
                        details: true,
                        nextToken: nextToken,
                        granularityType: 'Marketplace',
                        granularityId: process.env.MARKETPLACEID,
                        marketplaceIds: [process.env.MARKETPLACEID]
                    }
                });

                // NOTE Debug console.log("Debug Res: ", res);
                let inventory = [];
                
                for (let i = 0; i < res.inventorySummaries.length; i++) {
                    let element = {
                        asin: res.inventorySummaries[i].asin,
                        totalQuantity: res.inventorySummaries[i].totalQuantity,
                    }
                    inventory.push(element);
                }

                inventory['nextToken'] = res.nextToken;

                resolve(inventory);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}. Error en la función getInventorySummaries`)
            }
        });
    }


    //! EMPIEZA AREA DE FUNCIONES DE REPORTES 
    async createReport() {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    operation: 'createReport',
                    endpoint: 'reports',
                    body: {
                        "reportType": "GET_FLAT_FILE_OPEN_LISTINGS_DATA",
                        "dataStartTime": "2021-07-27T16:11:24.000Z",
                        "marketplaceIds": [
                            process.env.MARKETPLACEID
                        ]
                    }

                });
                resolve(res.reportId);
            } catch (e) {
                reject(e)
            }
        });
    }

    async getReport(report_id) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    operation: 'getReport',
                    endpoint: 'reports',
                    path: {
                        reportId: report_id
                    }
                });
                resolve(res)
            } catch (e) {
                reject(e)
            }
        });
    }


    async getReportDocument(report_id) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    operation: 'getReportDocument',
                    endpoint: 'reports',
                    path: {
                        reportDocumentId: report_id
                    }
                });
                resolve(res);
            } catch (e) {
                reject(e)
            }
        });
    }

    async downloadDocument(report_document) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.download(report_document, {
                    json: true
                });
                this.report_document = res;
                resolve(this.report_document)
            } catch (e) {
                reject(e)
            }
        });
    }

    async getQuantities(report_document = this.report_document) {
        return new Promise(async (resolve, reject) => {
            try {
                let element = [];
                for (let i = 0; i < report_document.length; i++) {
                    element[`${report_document[i].asin}`] = report_document[i].quantity;
                }
                resolve(element);
            } catch (e) {
                reject(e)
            }
        });
    }

}

module.exports = AmazonAPIModel;