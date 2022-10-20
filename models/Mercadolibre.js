require("dotenv").config();
const axios = require("axios");

class Mercadolibre {
	constructor() {}

	/**
	 *
	 * @package sellercontrol
	 * @version 2022.10.15
	 * @author Gerardo Gonzalez
	 *
	 * @param {String} code Code obtained from MercadoLibre, to obtain it refer to the page below
	 * @returns {Object} JSON object with the response information from the server
	 *
	 * @see https://developers.mercadolibre.com.mx/es_ar/autenticacion-y-autorizacion#Realizando-la-autorizaci%C3%B3n
	 *
	 */
	async getAccessToken(code) {
		return new Promise(async (resolve, reject) => {
			const options = {
				method: "post",
				baseURL: "https://api.mercadolibre.com/oauth/token",
				headers: {
					accept: "application/json",
					"content-type": "application/x-www-form-urlencoded",
				},
				params: {
					grant_type: "authorization_code",
					client_id: `${process.env.APP_ID}`,
					client_secret: `${process.env.SECRET_KEY}`,
					code: `${code}`,
					redirect_uri: `${process.env.REDIRECT_URI}`,
				},
			};

			call(options)
				.then((response) => resolve())
				.catch((error) => reject());
		});
	}

	/**
	 *
	 * @package sellercontrol
	 * @version 2022.10.15
	 * @author Gerardo Gonzalez
	 *
	 * @param {String} code Code obtained from MercadoLibre, to obtain it refer to the page below
	 * @returns {Object} JSON object with the response information from the server
	 *
	 * @see https://developers.mercadolibre.com.mx/es_ar/autenticacion-y-autorizacion#Refresh-token
	 *
	 */
	async getRefreshToken() {
		return new Promise(async (resolve, reject) => {
			const options = {
				method: "post",
				baseURL: "https://api.mercadolibre.com/oauth/token",
				headers: {
					accept: "application/json",
					"content-type": "application/x-www-form-urlencoded",
				},
				data: {
					grant_type: "refresh_token",
					client_id: `${process.env.APP_ID}`,
					client_secret: `${process.env.SECRET_KEY}`,
					refresh_token: `${retJSON.refresh_token}`,
				},
			};

			call(options)
				.then((response) => resolve())
				.catch((error) => reject());
		});
	}

	/**
	 *
	 * @package sellercontrol
	 * @version 2022.10.15
	 * @author Gerardo Gonzalez
	 *
	 * @param {String} user_id User code given by Mercadolibre, we can usually see it in the token call response
	 * @param {String} scroll_id Code provided in the first call by Mercadolibre, if it is not provided, it returns 
	 *                           the code, if null is provided, it will finish returning the products
	 * @returns {Object} JSON object with the response information from the server
	 *
	 * @see https://developers.mercadolibre.com.mx/es_ar/items-y-busquedas#Obtener-items-de-la-cuenta-de-un-vendedor
	 *
	 */
	async getProducts(user_id, scroll_id) {
        return new Promise(async (resolve, reject) => {
            const options = {
				method: "get",
				baseURL: `https://api.mercadolibre.com/users/${user_id}/items/search?search_type=scan${scroll_id}`,
				headers: {
					accept: "application/json",
					"content-type": "application/x-www-form-urlencoded",
				}
			};
            //TODO Revisar la respuesta para crear una formula recursiva
            call(options)
                .then((response) => {

                    resolve()
                })
                .catch((error) => reject());
            
        });
	}

	/**
	 *
	 * @package sellercontrol
	 * @version 2022.10.16
	 * @author Gerardo Gonzalez
	 *
	 * @param {Object} JSON object with the parameters to create a Mercadolibre product
	 * @returns {Object} JSON object with the response information from the server
	 *
	 * @see https://developers.mercadolibre.com.ar/es_ar/publica-productos#Publica-un-articulo
	 *
	 */
    async createProduct(data, access_token) {
        return new Promise(async (resolve, reject) => { 
            const options = {
				method: "post",
				baseURL: `https://api.mercadolibre.com/items`,
				headers: {
					'Authorization': `Bearer ${access_token}`
                },
                data:data
            };
            
            call(options)
                .then((response) => {
                
                const description = {
                        method: 'post',
                        baseURL: `https://api.mercadolibre.com/items/${response.data.id}/description`,
                        headers: {
                            'Authorization': `Bearer ${access_token}`
                        },
                        data: {
                            "plain_text": data.baseURLdescription,
                        }
                    }

			call(options)
                .then((response) => {

                    resolve()
                })
				.catch((error) => reject());
					
            })
            .catch((error) => reject());
         });
    }

	/**
	 *
	 * @package sellercontrol
	 * @version 2022.10.16
	 * @author Gerardo Gonzalez
	 *
	 * @param {String} item_id Mercadolibre product code
	 * @param {Object} JSON object with the parameters to update a Mercadolibre product
	 * @returns {Object} JSON object with the response information from the server
	 *
	 * @see https://developers.mercadolibre.com.ar/es_ar/producto-sincroniza-modifica-publicaciones#Actualiza-el-stock
	 *
	 */
	async updateProduct(item_id, data, access_token = this.access_token) {
        return new Promise(async (resolve, reject) => {
            let options = {
                method: 'put',
                baseURL: `https://api.mercadolibre.com/items/${item_id}`,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                },
                data: data
            }

			call(options)
                .then((response) => {

                    resolve()
                })
				.catch((error) => reject());
        });
    }

	/**
	 *
	 * @package sellercontrol
	 * @version 2022.10.16
	 * @author Gerardo Gonzalez
	 *
	 * @param {String} item_id Mercadolibre product code
	 * @returns {Object} JSON object with the response information from the server
	 *
	 * @see https://developers.mercadolibre.com.ar/es_ar/producto-sincroniza-modifica-publicaciones#Elimina-publicaciones
	 *
	 */
	async deleteProduct(item_id,access_token) {
		return new Promise(async (resolve, reject) => {
			let options = {
                method: 'put',
                baseURL: `https://api.mercadolibre.com/items/${item_id}`,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                },
                "status": "closed"
			}
			call(options)
				.then((response) => {
					options = {
						method: 'put',
						baseURL: `https://api.mercadolibre.com/items/${item_id}`,
						headers: {
							'Authorization': `Bearer ${access_token}`
						},
						"deleted": "true"
					}
			})
			.catch((error) => reject());
		 });
	}

    /**
	 *
	 * @package sellercontrol
	 * @version 2022.10.15
	 * @author Gerardo Gonzalez
	 *
	 * @param {Object} options JSON object with parameters
	 * @returns {Object} JSON object with the response information from the server
	 *
	 * @see https://www.npmjs.com/package/axios#axios-api
	 *
	 */
    async call(options) {
		return new Promise(async (resolve, reject) => {
			await axios(options)
				.then(async (res) => {
					console.log("Respuesta: ", res);
					resolve(res);
				})
				.catch(async (error) => {
					if (error.response) {
						// The request was made and the server responded with a status code
						// that falls out of the range of 2xx
						console.log(error.response.data);
						//console.log(error.response.status);
						//console.log(error.response.headers);
						reject(error.response.data);
					} else if (error.request) {
						// The request was made but no response was received
						// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
						// http.ClientRequest in node.js
						console.log(error.request);
						reject(error.request);
					} else {
						// Something happened in setting up the request that triggered an Error
						console.log("Error", error.message);
						reject(error.message);
					}
					console.log(error.config);
					reject(error.config);
				});
		});
	}
}

module.exports = Mercadolibre;
