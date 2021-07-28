require('dotenv').config();
const SellingPartnerAPI = require('amazon-sp-api');
const colors = require('colors');

class AmazonAPIModel {

    sellingPartner = null;
    access_token = null;
    role_credentials = null;
    item = null;
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
     * 
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

                resolve(this.sellingPartner);
            } catch (e) {
                reject(e);
            }
        });
    }

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
                this.item = res;
                resolve(this.item);
            } catch (e) {
                reject(e)
            }
        });
    }

    async getEAN(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item.identifiers[0].identifiers[1].identifier;
                resolve(res)

            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
            }
        });
    }

    async getBrandName(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item.summaries[0].brandName;
                resolve(res);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
            }
        });
    }

    async getManufacturer(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item.summaries[0].manufacturer;
                resolve(res);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
            }
        });
    }

    async getItemName(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item.summaries[0].itemName
                resolve(res);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
            }
        });
    }

    async getModelNumber(item = this.item) {
        return new Promise(async (resolve, reject) => {
            try {
                let res = item.summaries[0].modelNumber
                resolve(res);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
            }
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
                resolve(res[0].ProductCategoryName);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
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
                resolve(res[0].Product.Offers);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
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
                resolve(res[0].Product.CompetitivePricing.CompetitivePrices[0]);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
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
                resolve(res.Offers);
            } catch (e) {
                reject(`El objeto esta vacío, o no existe el valor. Error: ${e}`)
            }
        });
    }

    async createReport() {
        return new Promise(async (resolve, reject) => {
            try {
                let res = await this.sellingPartner.callAPI({
                    operation: 'createReport',
                    endpoint: 'reports',
                    body: {
                        "reportType": "GET_MERCHANT_LISTINGS_DATA",
                        "dataStartTime": "2021-07-24T16:11:24.000Z",
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

    async getQuantities(report_document = this.report_document){
        return new Promise(async(resolve, reject) => {
            try{
                let element = [];
                for (let i = 0; i < report_document.length; i++) {
                    element[`${report_document[i].asin1}`] = report_document[i].quantity;
                }
                resolve(element);
            }catch(e){
                reject(e)
            }
        });
    }

    
    asinObject = {

    }

}

module.exports = AmazonAPIModel;