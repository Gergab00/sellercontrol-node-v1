require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

class MercadoLibreAPIModel {

    access_token;
    category_name;
    category_id;
    description;

    async connect(code) {
        return new Promise(async (resolve, reject) => {
            let options;
            if (fs.existsSync('./json/AuthCode.json')) {
                let rawdata = fs.readFileSync("./json/AuthCode.json", 'utf8');
                let retJSON = await JSON.parse(rawdata);
                let start = new Date(retJSON.date);
                let actual = new Date();
                let dif = (actual - start) / 1000;
                if (dif > 21600) {
                    options = {
                        method: 'post',
                        baseURL: 'https://api.mercadolibre.com/oauth/token',
                        headers: {
                            'accept': 'application/json',
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        data: {
                            'grant_type': 'refresh_token',
                            'client_id': `${process.env.APP_ID}`,
                            'client_secret': `${process.env.SECRET_KEY}`,
                            'refresh_token': `${retJSON.refresh_token}`,
                        }
                    }

                } else {
                    await this.setAccessToken(retJSON.access_token);
                    resolve(`Access Token válido.`)
                }
            } else {
                options = {
                    method: 'post',
                    baseURL: 'https://api.mercadolibre.com/oauth/token',
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    params: {
                        'grant_type': 'authorization_code',
                        'client_id': `${process.env.APP_ID}`,
                        'client_secret': `${process.env.SECRET_KEY}`,
                        'code': `${code}`,
                        'redirect_uri': `${process.env.REDIRECT_URI}`
                    }
                }
            }

            await axios(options)
                .then(async (res) => {
                    let fecha = new Date();
                    let data = {
                        date: fecha,
                        access_token: res.data.access_token,
                        refresh_token: res.data.refresh_token
                    }
                    this.access_token = res.data.access_token;
                    fs.writeFile(
                        './json/AuthCode.json',
                        JSON.stringify(data, null, 2),
                        (err) => {
                            if (err) console.log(err)
                            else {
                                //console.log('\nFile data written successfully\n'.green);
                                //console.log('The written has the following contents:')
                                //console.log(fs.readFileSync('./json/AuthCode.json', 'utf8').blue);
                                console.log(`Conexión lograda con Mercadolibre con éxito! Access token recibido: ${res.data.access_token} y refresh token ${res.data.refresh_token}`);
                                resolve(`Conexión lograda con Mercadolibre con éxito! Access token recibido: ${res.data.access_token} y refresh token ${res.data.refresh_token}`);
                            }
                        },
                    );

                })
                .catch((error) => {
                    //console.log("Error en getAuthCode:".bgRed.black," ",error.message.red);
                    //console.log(colors.yellow(error.response.data),colors.yellow(error.response.config));
                    reject(`Error en connect: ${error.message}`);
                });

        });
    }
    /**
     * @version 1.0.0
     * @params {String} code - Código obtenido en https://auth.mercadolibre.com.mx/authorization?response_type=code&client_id=$APP_ID&redirect_uri=$YOUR_URL
     * @returns {Promise} If the promise are resolve, the metho return the response data and save a file with the info, if the promise will be reject the method return the response with the error
     * @deprecated
     */
    async getAuthCode(code) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'post',
                baseURL: 'https://api.mercadolibre.com/oauth/token',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/x-www-form-urlencoded'
                },
                params: {
                    'grant_type': 'authorization_code',
                    'client_id': `${process.env.APP_ID}`,
                    'client_secret': `${process.env.SECRET_KEY}`,
                    'code': `${code}`,
                    'redirect_uri': `${process.env.REDIRECT_URI}`
                }
            }

            await axios(options)
                .then(async (res) => {
                    let fecha = new Date();
                    let data = {
                        date: fecha,
                        access_token: res.data.access_token,
                        refresh_token: res.data.refresh_token
                    }
                    this.access_token = res.data.access_token;
                    fs.writeFile(
                        './json/AuthCode.json',
                        JSON.stringify(data, null, 2),
                        (err) => {
                            if (err) console.log(err)
                            else {
                                //console.log('\nFile data written successfully\n'.green);
                                //console.log('The written has the following contents:')
                                //console.log(fs.readFileSync('./json/AuthCode.json', 'utf8').blue);
                                resolve(`Conexión lograda con Mercadolibre con éxito! Access token recibido: ${res.data.access_token} y refresh token ${res.data.refresh_token}`);
                            }
                        },
                    );

                })
                .catch((error) => {
                    //console.log("Error en getAuthCode:".bgRed.black," ",error.message.red);
                    //console.log(colors.yellow(error.response.data),colors.yellow(error.response.config));
                    reject(`Error en getAuthCode: ${error.message}`);
                });
        });
    }

    /**
     * @deprecated
     */
    async refreshCode(refresh_token) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'post',
                baseURL: 'https://api.mercadolibre.com/oauth/token',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/x-www-form-urlencoded'
                },
                data: {
                    'grant_type': 'refresh_token',
                    'client_id': `${process.env.APP_ID}`,
                    'client_secret': `${process.env.SECRET_KEY}`,
                    'refresh_token': `${refresh_token}`,
                }
            }

            await axios(options)
                .then((res) => {
                    let fecha = new Date();
                    let data = {
                        date: fecha,
                        access_token: res.data.access_token,
                        refresh_token: res.data.refresh_token
                    }
                    this.access_token = res.data.access_token;
                    fs.writeFile(
                        './json/AuthCode.json',
                        JSON.stringify(data, null, 2),
                        (err) => {
                            if (err) console.log(err)
                            else {
                                //console.log('\nFile data written successfully\n'.green);
                                //console.log('The written has the following contents:')
                                //console.log(fs.readFileSync('./json/AuthCode.json', 'utf8').blue);
                                resolve(`Conexión lograda con éxito! Access token recibido: ${res.data.access_token} y refresh token ${res.data.refresh_token}`);
                            }
                        },
                    );
                    //console.log(res.blue);
                })
                .catch((error) => {
                    //console.log("Error en refresChode".bgRed.black," ",error.message.red);
                    //console.log(colors.yellow(error.response.data),colors.yellow(error.response.config));
                    reject(`Error en getAuthCode: ${error.message}`);
                });
        });
    }

    /**
     * 
     * @param {String} access_token 
     * @param {String} product 
     * @returns {!Promise<String>} That if are resolve return a String with the code of category
     */
    async getProductCategory(product, access_token = this.access_token) {
        return new Promise(async (resolve, reject) => {
            let sanProduct = await this.normalize(product);
            //console.log('Producto Sanitizado: ', sanProduct);
            let options = {
                method: 'get',
                baseURL: `https://api.mercadolibre.com/sites/MLM/domain_discovery/search?limit=1&q=${sanProduct}`,
                headers: {
                    'Authorization': `bearer ${access_token}`
                }
            };
            await axios(options)
                .then((res) => {
                    //console.log("Categoria obtenida exitosamente: ");
                    //console.log(res);
                    (res.data.length == 0) ? this.category_id = 'undefined' : this.category_id = res.data[0].category_id;
                    resolve(this.category_id);
                })
                .catch((error) => {
                    //console.log("Error en getProductCategory:".bgRed.black," ",error.message.red);
                    //console.log(colors.yellow(error.response.data),colors.yellow(error.response.config));
                    reject(`Error en getProductCategory: ${error.message}`);
                });
        });
    }

    /**
     * 
     * @param {String} access_token 
     * @param {String} product 
     * @returns {!Promise<String>} That if are resolve return a String with the name of category
     */
    async getProductCategoryName(product, access_token = this.access_token) {
        return new Promise(async (resolve, reject) => {
            let sanProduct = await this.normalize(product);
            //console.log('Producto Sanitizado: ', sanProduct);
            let options = {
                method: 'get',
                baseURL: `https://api.mercadolibre.com/sites/MLM/domain_discovery/search?limit=1&q=${sanProduct}`,
                headers: {
                    'Authorization': `bearer ${access_token}`
                }
            };
            await axios(options)
                .then((res) => {
                    //console.log("Categoria obtenida exitosamente: ".green,colors.green(res.data));
                    //console.log(res.data[0].category_id);
                    (res.data.length == 0) ? this.category_name = 'undefined' : this.category_name = res.data[0].category_name;
                    
                    resolve(this.category_name);
                })
                .catch((error) => {
                    //console.log("Error en getProductCategory:".bgRed.black," ",error.message.red);
                    //console.log(colors.yellow(error.response.data),colors.yellow(error.response.config));
                    reject(`Error en getProductCategory: ${error.message}`);
                });
        });
    }

     /**
     * 
     * @param {String} access_token 
     * @param {String} product 
     * @returns {!Promise<String>} That if are resolve return a Array with the category att
     */
      async getProductCategoryAtt(product, access_token = this.access_token) {
        return new Promise(async (resolve, reject) => {
            let sanProduct = await this.normalize(product);
            //console.log('Producto Sanitizado: ', sanProduct);
            let options = {
                method: 'get',
                baseURL: `https://api.mercadolibre.com/sites/MLM/domain_discovery/search?limit=1&q=${sanProduct}`,
                headers: {
                    'Authorization': `bearer ${access_token}`
                }
            };
            await axios(options)
                .then((res) => {
                    //console.log("Categoria obtenida exitosamente: ".green,colors.green(res.data));
                    //console.log(res.data[0].category_id);
                    //(res.data.length == 0) ? this.category_name = 'undefined' : this.category_name = res.data[0].category_name;
                    
                    resolve(res.data[0]);
                })
                .catch((error) => {
                    //console.log("Error en getProductCategory:".bgRed.black," ",error.message.red);
                    //console.log(colors.yellow(error.response.data),colors.yellow(error.response.config));
                    reject(`Error en getProductCategory: ${error.message}`);
                });
        });
    }

    //NOTE se esta probando, ya funciono una vez se esta mejorando, ya se logro que acepte los articulos, se procede a mandar el json para hacerlo dinamico.
    async createProduct(dataProduct, category_id = this.category_id, access_token = this.access_token) {
        return new Promise(async (resolve, reject) => {

            let options = {
                method: 'post',
                baseURL: 'https://api.mercadolibre.com/items',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                },
                data: {
                    "title": `${dataProduct.name.slice(0,60)}`,
                    "category_id": `${category_id}`,
                    "price": await this.aumentarPrecio(dataProduct.regular_price, 1.2),
                    "currency_id": "MXN",
                    "available_quantity": dataProduct.stock_quantity,
                    "buying_mode": "buy_it_now",
                    "condition": "new",
                    "listing_type_id": "gold_special",
                    /*"description": {
                        "plain_text": ""
                    },*/
                    "video_id": "",
                    "sale_terms": [{
                            "id": "WARRANTY_TYPE",
                            "name": "Tipo de garantía",
                            "value_id": "2230280",
                            "value_name": "Garantía del vendedor",
                            "value_struct": null,
                            "values": [{
                                "id": "2230280",
                                "name": "Garantía del vendedor",
                                "struct": null
                            }]
                        },
                        {
                            "id": "WARRANTY_TIME",
                            "name": "Tiempo de garantía",
                            "value_id": null,
                            "value_name": "90 dias",
                            "value_struct": {
                                "number": 90,
                                "unit": "días"
                            },
                            "values": [{
                                "id": null,
                                "name": "90 dias",
                                "struct": {
                                    "number": 90,
                                    "unit": "días"
                                }
                            }]
                        }
                    ],
                    "pictures": await this.normalizePictures(dataProduct).catch(async ()=>{return []}),
                    "attributes": [{
                            "id": "MANUFACTURER",
                            "value_name": `${dataProduct.meta_data[2].value}`
                        },
                        {
                            "id": "BRAND",
                            "value_name": `${dataProduct.meta_data[1].value}`
                        },
                        {
                            "id": "EAN",
                            "value_name": `${dataProduct.meta_data[0].value}`
                        },
                        {
                            "id": "SELLER_SKU",
                            "value_name": `${dataProduct.sku}`
                        },
                        {
                            "id": "PACKAGE_HEIGHT",
                            "value_name": `${dataProduct.dimensions.height}`
                        },
                        {
                            "id": "PACKAGE_WIDTH",
                            "value_name": `${dataProduct.dimensions.width}`
                        },
                        {
                            "id": "PACKAGE_LENGTH",
                            "value_name": `${dataProduct.dimensions.length}`
                        },
                        {
                            "id": "PACKAGE_WEIGHT",
                            "value_name": `${await this.aumentarPrecio(dataProduct.weight,1000)}`
                        },
                        {
                            "id": "MODEL",
                            "value_name": `${dataProduct.meta_data[3].value}`
                        }

                    ]
                }
            }

            this.description = dataProduct.description + dataProduct.short_description;

            await axios(options)
                .then((res) => {
                    console.log(`Producto creado exitosamente en Mercadolibre con SKU ${res.data}`)
                    resolve(res.data);
                }).catch((error) => {

                    reject(`Error en createProduct: ${error.message}. Code: ${error.response.toString()}`);
                    
                });
        });
    }

    async createDescription(item_id, description = this.description, access_token = this.access_token) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'post',
                baseURL: `https://api.mercadolibre.com/items/${item_id}/description`,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                },
                data: {
                    "plain_text": `${description.replace(/(<([^>]+)>)/ig, '')}`
                }
            }
            await axios(options)
                .then((res) => {
                    console.log("Descripción creada exitosamente");
                    resolve(res);
                }).catch((error) => {
                    console.log("Error en createDescription: ", error.message);
                    console.log(error.response.data /*,colors.magenta(error.response)*/ );
                    reject(error);
                });
        });
    }

    /**
     * @description Funcion que revisa si el producto existe o no.
     * 
     * @param {String} seller_sku Sku que se buscara en Mercadolibre para ver si existe.
     * @param {String} access_token Access token obtenido anteriormente.
     * @returns {!Promise<boolean>} Devuelve una promesa, si no se cumple la promesa devuelve un mensaje de error. Si se cumple regresa un booleano, si es verdadero el producto existe, si es falso no existe.
     */
    async existsProduct(seller_sku, access_token = this.access_token) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: `https://api.mercadolibre.com/users/${process.env.USER_ID}/items/search?seller_sku=${seller_sku}`,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            };

            await axios(options)
                .then(async (res) => {
                    let ret = false;
                    if (res.data.results.length != 0) ret = true;
                    resolve(ret)
                })
                .catch(async (error) => {
                    reject(error)
                });
        });
    }

    async getIDProduct(seller_sku, access_token = this.access_token) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'get',
                baseURL: `https://api.mercadolibre.com/users/${process.env.USER_ID}/items/search?seller_sku=${seller_sku}`,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            };

            await axios(options)
                .then(async (res) => {
                    resolve(res.data.results[0])
                })
                .catch(async (error) => {
                    reject(error)
                });
        });
    }

    async searchProducts(key_word,product_identifier, access_token = this.access_token){
        return new Promise(async (resolve, reject) => {
            let baseURL;
            (key_word != "") ? baseURL = `https://api.mercadolibre.com/products/search?status=inactive&site_id=MLM&q=${encodeURIComponent(key_word)}` : baseURL=`https://api.mercadolibre.com/products/search?status=inactive&site_id=MLM&product_identifier=${product_identifier}`
            let options = {
                method: 'get',
                baseURL: baseURL,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            };

            await axios(options)
                .then(async (res) => {
                    console.log('Respuesta de searchProducts obtenida con exito.');
                    resolve(res)
                })
                .catch(async (error) => {
                    reject(error)
                });
        });
    }

    async updateProduct(item_id, data, access_token = this.access_token){
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'put',
                baseURL: `https://api.mercadolibre.com/items/${item_id}`,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                },
                data: data
            }
            
            await axios(options)
                .then(async (res) => {
                    resolve(res)
                })
                .catch(async (error) => {
                    reject(error)
                });
        });
    }

    //* Otras funciones
    async setAccessToken(access_token) {
        this.access_token = access_token;
    }
    /**
     * Función que da formato a la fecha con la composición YYYY-MM-DDTHH:MM:SS
     * 
     * @param {Date} fecha 
     * @returns {String} De la fecha con el formato necesario.
     */
    async formatoFecha(fecha) {
        return new Promise(resolve => {
            const map = {
                dd: ('0' + fecha.getDate()).slice(-2),
                mon: ('0' + (fecha.getUTCMonth() + 1)).slice(-2),
                yyyy: fecha.getFullYear(),
                hh: ('0' + fecha.getHours()).slice(-2),
                min: ('0' + fecha.getMinutes()).slice(-2),
                ss: ('0' + fecha.getSeconds()).slice(-2)
            }

            let formattedDate = `${map.yyyy}-${map.mon}-${map.dd}T${map.hh}:${map.min}:${map.ss}`
            resolve(formattedDate);
        });
    }

    async normalizePictures(pics) {
        return new Promise(async (resolve, reject) => {

            let pictures = [];
            if (0 != pics.images.length) {
                for (let j = 0; j < pics.images.length; j++) {
                    let a = {
                        "source": pics.images[j].src
                    }
                    pictures.push(a);
                }
                resolve(pictures);
            } else {
                reject("Error en normalizePictures.");
            }

        });
    }

    async normalize(str) {
        return new Promise(async resolve => {
            let from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç",
                to = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc",
                mapping = {};

            for (let i = 0, j = from.length; i < j; i++)
                mapping[from.charAt(i)] = to.charAt(i);

            let ret = [];
            for (let i = 0, j = str.length; i < j; i++) {
                let c = str.charAt(i);
                if (mapping.hasOwnProperty(str.charAt(i)))
                    ret.push(mapping[c]);
                else
                    ret.push(c);
            }
            ret = ret.join('').replace(/[^-A-Za-z0-9]+/g, '%20');

            resolve(ret);
        });
    }

    /**
     * Funcion que aumenta el precio segun el valor que se le de en porcentaje mayor a 1, por ejemplo 1.2 para aumentar en 20%
     * 
     * @param {number} price 
     * @param {float} aumento 
     * @returns {float} El valor del precio aumentado en el porcentaje indicado
     */
    async aumentarPrecio(price, aumento) {
        let pricef = Number.parseFloat(price.replace(",", ""));
        let p = pricef * aumento;
        return p.toFixed(2);
    }

}

module.exports = MercadoLibreAPIModel;