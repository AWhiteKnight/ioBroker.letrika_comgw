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
let intervalLow;
let intervalHigh;

let adapter;

async function intervalHandlerLow() {
	const reqPanelData = {
		host: adapter.config.comgwIp,
		port: adapter.config.comgwPort,
		path: '/system_info',
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	};
	adapter.getJSON(reqPanelData, (result) => {
		adapter.handleSystemInfo(JSON.parse(result));
		intervalLow = setTimeout(intervalHandlerLow, 3600000);
	});
}

async function intervalHandlerHigh() {
	// read inverter data
	const reqPanelData = {
		host: adapter.config.comgwIp,
		port: adapter.config.comgwPort,
		path: '/get_changes',
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	};
	adapter.getJSON(reqPanelData, (result) => {
		const obj = JSON.parse(result);
		adapter.handleInverterInfo(obj.inverter_info);
		adapter.handlePlantInfo(obj.plant_info);
		adapter.handleAlarmHistory(obj.alarm_history);
		intervalHigh = setTimeout(intervalHandlerHigh, adapter.config.comgwInterval * 60000);

	});
}

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
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// await this.setStateChanged('info.connection', false, true);
		adapter = this;
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
			const helper = require(__dirname + '/lib/helper.js');
			// "static" data
			request.path = '/get_time_settings';
			await this.getJSON(request, (result) => {
				const obj = JSON.parse(result);
				helper.handleTimeSettings(adapter, obj);
			});
			request.path = '/get_settings';
			await this.getJSON(request, (result) => {
				const obj = JSON.parse(result);
				helper.handleSettings(adapter, obj);
			});
			request.path = '/get_network_settings';
			await this.getJSON(request, (result) => {
				const obj = JSON.parse(result);
				helper.handleNetworkSettings(adapter, obj);
			});
			request.path = '/get_cloud_settings';
			await this.getJSON(request, (result) => {
				const obj = JSON.parse(result);
				helper.handleCloudSettings(adapter, obj);
			});

			// low volatile data
			helper.createSystemInfoEntries(this);
			intervalHandlerLow();
			// read low volatile data once an hour
			intervalLow = setTimeout(intervalHandlerLow, 3600000);

			// highly volatile data
			helper.createPlantInfoEntries(this);
			request.path ='/get_changes';
			await this.getJSON(request, (result) => {
				const obj = JSON.parse(result);
				obj.inverter_info.forEach(element => {
					const helper = require(__dirname + '/lib/helper.js');
					helper.createInverterEntries(adapter, element);
				});
				this.handlePlantInfo(obj.plant_info)
				this.handleInverterInfo(obj.inverter_info);
				this.handleAlarmHistory(obj.alarm_history);
			});
			// read highly volatile data regularly
			intervalHigh = setTimeout(intervalHandlerHigh,	this.config.comgwInterval * 60000);

			await this.setStateChanged('info.connection', true, true);		
		} catch(err) {
			this.log.error(err);
			await this.setStateChanged('info.connection', false, true);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			if(intervalLow) {clearTimeout(intervalLow);}
			if(intervalHigh) {clearTimeout(intervalHigh);}
			this.log.info('cleaned everything up...');
			callback();
		} catch (e) {
			callback();
		}
	}

	handleInverterInfo(data) {
		// this.log.debug(JSON.stringify(info));
		data.forEach(element => {
			// this.log.debug('updating ' + element.inverter);
			this.setStateChanged(element.inverter + '.hw_version', {val: element.hw_version, ack: true});
			this.setStateChanged(element.inverter + '.sw_version_pri', {val: element.sw_version_pri, ack: true});
			this.setStateChanged(element.inverter + '.sw_version_sec', {val: element.sw_version_sec, ack: true});
			this.setStateChanged(element.inverter + '.max_power', {val: element.max_power, ack: true});
			this.setStateChanged(element.inverter + '.protocol_ver', {val: element.protocol_ver, ack: true});
			this.setStateChanged(element.inverter + '.status', {val: element.status == 'working' ? true : false, ack: true});

			this.setStateChanged(element.inverter + '.measurement.energy', {val: element.measurement.energy, ack: true});
			this.setStateChanged(element.inverter + '.measurement.power', {val: element.measurement.power, ack: true});

			this.setStateChanged(element.inverter + '.details.max_power_soft', {val: element.details.max_power_soft, ack: true});
			this.setStateChanged(element.inverter + '.details.cos_phi', {val: element.details.cos_phi, ack: true});
			this.setStateChanged(element.inverter + '.details.power_status', {val: element.details.power_status == 'on' ? true : false, ack: true});
			this.setStateChanged(element.inverter + '.details.grid_freq', {val: element.details.grid_freq, ack: true});
			this.setStateChanged(element.inverter + '.details.dcdc_temp', {val: element.details.dcdc_temp, ack: true});
			this.setStateChanged(element.inverter + '.details.dcac_temp', {val: element.details.dcac_temp, ack: true});
			this.setStateChanged(element.inverter + '.details.sec_dc_voltage', {val: element.details.sec_dc_voltage, ack: true});
			this.setStateChanged(element.inverter + '.details.alarm', {val: element.details.alarm, ack: true});
		});
	}

	handlePlantInfo(data) {
		this.setStateChanged('info.plant.country', {val: data.country, ack: true});
		this.setStateChanged('info.plant.total_energy', {val: data.total_energy, ack: true});
		this.setStateChanged('info.plant.today_energy', {val: data.today_energy, ack: true});
		this.setStateChanged('info.plant.power', {val: data.power, ack: true});
		this.setStateChanged('info.plant.cos_phi', {val: data.cos_phi, ack: true});
		this.setStateChanged('info.plant.cos_phi_mode', {val: data.cos_phi_mode, ack: true});
		this.setStateChanged('info.plant.max_power', {val: data.max_power, ack: true});
		this.setStateChanged('info.plant.status', {val: data.status, ack: true});
		this.setStateChanged('info.plant.price_per_kw', {val: data.price_per_kw, ack: true});
	}


	handleAlarmHistory(data) {
		this.log.debug('alerts: ' + JSON.stringify(data));
		if(data.length > 0) {
			adapter.setStateChanged('has_alert', {val: true, ack: true});
		}
		data.forEach(element => {
			const id = element[0];
			// const timestamp = element[1];
			// const alert = element[2];
			const device = '00000000';
			this.setStateChanged(device + '.has_alert', {val: true, ack: true});
		});
	}

	handleSystemInfo(data) {
		this.setStateChanged('info.system.sw_version', {val: data.sw_version, ack: true});
		this.setStateChanged('info.system.sys_version', {val: data.sys_version, ack: true});
		this.setStateChanged('info.system.storage_status', {val: data.storage_status, ack: true});
		this.setStateChanged('info.system.storage_used', {val: data.storage_used, ack: true});
		this.setStateChanged('info.system.storage_size', {val: data.storage_size, ack: true});
	}

	getJSON(options, cbOnResult) {
		const port = options.port == 443 ? https : http;

		let output = '';

		const req = port.request(options, (res) => {
			// res.setEncoding('utf8');

			res.on('data', (chunk) => {
				output += chunk;
			});

			res.on('end', () => {
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