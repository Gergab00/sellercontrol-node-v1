const colors = require('colors');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

class WoocommerceAPIModel {

    api = null;

    constructor(url = "http://localhost:8081/wordpress") {
        this.url = url;
    }

    async connect() {
        this.api = new WooCommerceRestApi({
            url: this.url,
            consumerKey: "ck_4dcb91e9d2a99eca8b90373a9ce6470b9b748014",
            consumerSecret: "cs_431b0dfaf94c88857d7c09e112edf478bd1236e4",
            version: "wc/v3"
        });

        return this.api;
    }

    async createProduct(dataProduct, api = this.api) {
        return new Promise(async (resolve, reject) => {
                api.post("products", dataProduct)
                .then(async(res)=>{
                    resolve(res)
                })
                .catch(async(error)=>{
                    reject(error.response.data)
                });
        });
    }

    async existsProduct(sku, api = this.api) {
        return new Promise(async (resolve, reject) => {
            let ret;
            api.get("products", {
                    sku: sku
                })
                .then((response) => {
                    // Successful requess
                    if(1===response.data.length){ret = false;}else{ret = true;} //Si existe el producto regresa true, si no existe regresa false
                    resolve(ret);
                });
        });
    }

    async getProduct(sku, api = this.api) {
        return new Promise(async (resolve, reject) => {
            let ret;
            api.get("products", {
                    sku: sku
                })
                .then((response) => {
                    // Successful requess
                   resolve(response.data);
                })
        });
    }

    async getInventorySummaries(page = 1, api = this.api){
        return new Promise(async (resolve, reject) => {
            api.get("products",{
                page:page
            })
            .then(async(res)=>{
                resolve(res.data)
            })
            .catch(async(error)=>{
                reject(error)
            })
        });
    }
}

module.exports = WoocommerceAPIModel;