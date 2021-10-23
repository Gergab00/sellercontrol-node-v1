const WoocommerceApiModel = require('../woocommerce/WoocommerceApiModel');
const MercadoLibreAPIModel = require('../mercadolibre/MercadoLibreAPIModel.js');
const dataProduct = require('../dataProduct');
const fs = require('fs');

class MercadoLibreWoocommerceController {

    browser;
    wooAPI;
    mlAPI;

    /**
     * @description Function that makes the connection with the free market API, either with unrefrsh code or with an AuthCode, as the case may be.
     *  
     * @param {String} authcode This parameter is only necessary if you log in for the first time, or you do not have the Refresh Token
     * @returns {Promise} Returns a promise, if the promise is resolved, returns a successful connection message, if the promise is rejected an error message is returned
     */
    async createConections(authcode) {
        return new Promise(async (resolve, reject) => {
            this.mlAPI = new MercadoLibreAPIModel();
            this.wooAPI = new WoocommerceApiModel();
            await this.wooAPI.connect();
            if (fs.existsSync('./json/AuthCode.json')) {
                let rawdata = fs.readFileSync("./json/AuthCode.json", 'utf8');
                let retJSON = await JSON.parse(rawdata);
                let start = new Date(retJSON.date);
                let actual = new Date();
                let dif = (actual - start) / 1000;
                if (dif > 21600) {
                    let refresh_token = retJSON.refresh_token;
                    await this.mlAPI.refreshCode(refresh_token)
                        .then(async (res) => {
                            resolve(res)
                        })
                        .catch(async (error) => {
                            reject(error)
                        });
                } else {
                    await this.mlAPI.setAccessToken(retJSON.access_token);
                    resolve(`Access Token válido.`)
                }
            } else {
                this.mlAPI.getAuthCode(authcode)
                    .then(async (res) => {
                        resolve(res)
                    })
                    .catch(async (error) => {
                        reject(error)
                    })
            }
        });
    }

    async getAvailableSku() {
        return new Promise(async (resolve, reject) => {
            let i = 1;
            let ret = [];
            let condition;
            do {
                await this.wooAPI.getInventorySummaries(i)
                    .then(async (res) => {
                        condition = res.length;
                        for (let j = 0; j < res.length; j++) {
                            if(res[j].stock_status == "instock") ret.push(res[j].sku);
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

    async updateWoocommerceWithMercadoLibre(dataProduct){
        return new Promise(async (resolve, reject) => {
            dataProduct.meta_data[6].value = await this.mlAPI.getProductCategory(dataProduct.name);
            dataProduct.meta_data[7].value = await this.mlAPI.getProductCategoryName(dataProduct.name);
            await this.wooAPI.updateProduct(dataProduct)
            .then(async(res)=>{
                resolve(`El producto con SKU ${res.sku} se ha actualizado con éxito.`)
            })
            .catch(async(error)=>{
                //console.log("Error: ", error);
                reject(`Error al actualizar el producto. Error: ${error}`)
            })
        });
    }

    //NOTE Modificar esta función para crearla como el AmazonWoocommerceController
    async copyWoocommerceToMercadoLibre(sku) {
        return new Promise(async (resolve, reject) => {
            if (!await this.mlAPI.existsProduct(sku)) {
                await this.wooAPI.getProduct(sku)
                .then(async(res)=>{
                    await this.mlAPI.getProductCategory(res[0].name);
                    await this.mlAPI.createProduct(res[0])
                    .then(async(res)=>{
                        await this.mlAPI.createDescription(res.id,);
                        resolve(`Producto creado exitosamente ${res.id}`)
                        
                    })
                    .catch(async(error)=>{
                        reject(error);
                    })
                })
                .catch(async(error)=>{
                    reject(error);
                })
            } else {
                reject(`No se pudo crear el producto con SKU ${sku}. El proucto ya existe.`)
            }
        });
    }

}

module.exports = MercadoLibreWoocommerceController;