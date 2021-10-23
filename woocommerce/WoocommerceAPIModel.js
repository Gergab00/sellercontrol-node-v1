require('dotenv').config();
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

class WoocommerceAPIModel {

    api;
    url;

    constructor(url = "http://localhost:8081/wordpress/") {
        this.url = url;
    }

    async connect() {
        return new Promise(async (resolve, reject)=>{
            this.api = new WooCommerceRestApi({
                url: "http://localhost:8081/wordpress/",
                consumerKey: process.env.WC_CONSUMER_KEY,
                consumerSecret: process.env.WC_CONSUMER_SECRET,
                version: "wc/v3"
            });

            if(this.api != null){
                resolve(this.api)
            }else{
                reject('Error al intentar conectar con Woocommerce')
            }
        });
        
    }

    async createProduct(dataProduct, api= this.api) {
        return new Promise(async (resolve, reject) => {
                api.post("products", dataProduct)
                .then(async(res)=>{
                    resolve(res)
                })
                .catch(async(error)=>{
                    console.log("Response Status:", error.response.status);
                    console.log("Response Headers:", error.response.headers);
                    console.log("Response Data:", error.response.data);
                    reject(error.response.data)
                });
        });
    }

    //WARING Esta función actualmente no funciona correctamente se tiene que corregir.
    async updateProduct(dataProduct, api= this.api){
        return new Promise(async (resolve, reject) => {
            let id = await this.getProduct(dataProduct.sku, api)
            .catch(async(error)=>{
                console.log("Response getProduct Status:", error.response.status);
                console.log("Response getProduct Headers:", error.response.headers);
                console.log("Response getProduct Data:", error.response.data);
                reject(error.response.data)
            });
            let stg = `products/${id.id}`;
            console.log(stg);
            api.put(stg, dataProduct)
                .then(async(res)=>{
                    resolve(res)
                })
                .catch(async(error)=>{
                    console.log("Response putProducts Status:", error.response.status);
                    console.log("Response putProducts Headers:", error.response.headers);
                    console.log("Response putProducts Data:", error.response.data);
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
                    console.log(`Resultado de existsProducts ${ret}`)
                    resolve(ret);
                }).catch((error) => {
                    // Invalid request, for 4xx and 5xx statuses
                    console.log("Response Error:", error);
                  });
        });
    }

    async getProduct(sku, api = this.api) {
        return new Promise(async (resolve, reject) => {
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