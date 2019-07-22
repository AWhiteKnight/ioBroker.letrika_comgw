/* jshint -W119 */
/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';

/*
 *
 * letrika_comgw adapter - collects data from Letrika SMI 260 via communication gateway
 *  (c) 2019 AWhiteKnight
 *  @author: AWhiteKnight <awhiteknight@unity-mail.de>
 *  @license: MIT
 *
 * Created with @iobroker/create-adapter v1.16.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
// const fs = require("fs");
const http = require('http');
const https = require('https');
let interval;


class LetrikaComgw extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'letrika_comgw',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		this.setStateChanged('info.connection', false, true);
		// Initialize your adapter here
		try {
			this.log.debug('starting letrika_comgw');
			const request = {
				host: this.config.comgwIp,
				port: this.config.comgwPort,
				path: '',
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			};
			// read general system information
			request.path = '/system_info';
			this.getJSON(request, (result) => {
				this.log.debug(result);
				// read server settings
				request.path ='/get_settings';
				this.getJSON(request, (result) => {
					this.log.debug(result);
					// read available inverters
					request.path ='/get_inverter_info';
					this.getJSON(request, (result) => {
						this.log.debug(result);
						// read inverter measurement this needs to be done in a loop!
						request.path = '/get_measurements';
						const handler = this.getJSON(request, (result) => {
							this.log.debug(result);
						});
						// @ts-ignore
						interval = setInterval(handler,	this.config.comgwInterval * 60000);
						this.setStateChanged('info.connection', true, true);

					});
				});
			});
		} catch(err) {
			this.log.error(err);
			this.setStateChanged('info.connection', false, false);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			if(interval) {clearInterval(interval);}
			this.log.info('cleaned everything up...');
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === 'object' && obj.message) {
	// 		if (obj.command === 'send') {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info('send command');

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 		}
	// 	}
	// }

	getJSON(options, cbOnResult) {
		const port = options.port == 443 ? https : http;

		let output = '';

		const req = port.request(options, (res) => {
			res.setEncoding('utf8');

			res.on('data', (chunk) => {
				output += chunk;
			});

			res.on('end', () => {
				this.log.debug(res.statusCode + ':' + output);
				if(res.statusCode == 200) {
					cbOnResult(output);
				} else {
					this.log.error(`request ${options.method} ${options.path} : ${res.statusCode}`);
				}
			});
		});

		req.on('error', (err) => {
			this.log.error('error: ' + err.message);
		});

		req.end();
	}
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new LetrikaComgw(options);
} else {
	// otherwise start the instance directly
	new LetrikaComgw();
}